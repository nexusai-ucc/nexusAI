// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import { describe, it, expect, afterEach } from "vitest";
import * as history from "./history.js";
import { searchMaterial } from "./search.js";
import * as alerts from "./calendarAlerts.js";
import { getUpcomingEvents } from "./calendar.js";
import * as onboarding from "./onboarding.js";
import * as forum from "./forumDigest.js";
import { listCourseSections } from "./courseSections.js";
import { installMoodleAjax, uninstallMoodleAjax, ajaxCalls, withFakeTimers } from "../test-utils/moodleAjax.js";

// TPC-05 (#577): el resto de los clientes de web services (historial,
// búsqueda, calendario, onboarding, foros y secciones), dentro y fuera de Moodle.

afterEach(() => {
    uninstallMoodleAjax();
});

describe("dentro de Moodle", () => {
    it.each([
        [() => history.listSessions({ courseId: 5 }), "local_nexusai_chat_sessions_list", { courseid: 5, scopecourse: true, limit: 20 }],
        [() => history.getSessionMessages({ courseId: 5, sessionId: "s1" }), "local_nexusai_chat_session_messages", { courseid: 5, sessionid: "s1" }],
        [() => history.deleteSession({ courseId: 5, sessionId: "s1" }), "local_nexusai_chat_session_delete", { courseid: 5, sessionid: "s1" }],
        [() => onboarding.getCourseSetupState(5), "local_nexusai_course_setup_state", { courseid: 5 }],
        [() => onboarding.getOnboardingState(5), "local_nexusai_onboarding_state_get", { courseid: 5 }],
        [() => onboarding.setOnboardingState(5, { dismissed: 1 }), "local_nexusai_onboarding_state_set", { courseid: 5, dismissed: true, skipped: [] }],
        [() => forum.getWeeklyDigest(5), "local_nexusai_forum_weekly_digest", { courseid: 5, days: 7 }],
        [() => listCourseSections(5), "local_nexusai_course_sections_list", { courseid: 5 }],
        [() => alerts.saveCalendarAlert({ userId: 1, courseId: 5, eventId: 9, eventName: "Parcial", eventTimestamp: 100, daysBefore: 3 }),
            "local_nexusai_calendar_alert_save",
            { userid: 1, courseid: 5, eventid: 9, eventname: "Parcial", eventtimestamp: 100, daysbefore: 3 }],
    ])("%#: llama al web service correcto y devuelve su respuesta", async (call, methodname, args) => {
        // Arrange.
        installMoodleAjax({ [methodname]: { ok: methodname } });

        // Act.
        const result = await call();

        // Assert.
        expect(ajaxCalls).toEqual([{ methodname, args }]);
        expect(result).toEqual({ ok: methodname });
    });

    it("la búsqueda limpia la consulta y manda -1 cuando no hay unidad", async () => {
        // Arrange.
        installMoodleAjax({ local_nexusai_search_query: { total: 0, results: [] } });

        // Act.
        await searchMaterial({ query: "  árboles  ", courseId: 5 });

        // Assert.
        expect(ajaxCalls[0].args).toEqual({
            query: "árboles", courseid: 5, topk: 5, global: false, materialtype: "", section: -1, sectionunassigned: false,
        });
    });

    it("las alertas y el feed devuelven el campo que interesa, o un vacío si falta", async () => {
        // Arrange.
        installMoodleAjax({
            local_nexusai_calendar_alerts_list: { alerts: [{ event_id: 9 }] },
            local_nexusai_calendar_feed_url: { url: "https://m/feed?t=1" },
            local_nexusai_calendar_feed_revoke: {},
        });

        // Act.
        const list = await alerts.listCalendarAlerts(1, 5);
        const url = await alerts.getCalendarFeedUrl(5);
        const revoked = await alerts.revokeCalendarFeed(5);

        // Assert.
        expect(list).toEqual([{ event_id: 9 }]);
        expect(url).toBe("https://m/feed?t=1");
        expect(revoked).toBe("");
    });

    it("el calendario junta eventos de actividades y avisos generales, ordenados por fecha", async () => {
        // Arrange.
        installMoodleAjax({
            core_calendar_get_action_events_by_course: { events: [{ id: 1, name: "Entrega", timesort: 300 }] },
            core_calendar_get_calendar_events: {
                events: [
                    { id: 2, name: "Feriado", timestart: 200 },
                    { id: 3, name: "Quiz", timestart: 250, modulename: "quiz" },
                ],
            },
        });

        // Act.
        const events = await getUpcomingEvents(5, 10);

        // Assert.
        expect(events.map((e) => e.id)).toEqual([2, 1]);
        expect(events[0].url).toContain("course=5");
    });

    it("si fallan los avisos generales, igual devuelve los eventos de actividades", async () => {
        // Arrange.
        installMoodleAjax({ core_calendar_get_action_events_by_course: { events: [{ id: 1, timesort: 1 }] } });

        // Act.
        const events = await getUpcomingEvents(5);

        // Assert.
        expect(events).toEqual([{ id: 1, timesort: 1 }]);
    });

    it("el webhook del foro llama a su web service", async () => {
        // Arrange.
        installMoodleAjax({ local_nexusai_forum_webhook_get: {}, local_nexusai_forum_webhook_save: {} });

        // Act.
        await forum.getForumWebhook(5);
        await forum.saveForumWebhook(5, "https://hooks.test/x");

        // Assert. El valor devuelto queda para el registro de defectos (TPC-06).
        expect(ajaxCalls).toEqual([
            { methodname: "local_nexusai_forum_webhook_get", args: { courseid: 5 } },
            { methodname: "local_nexusai_forum_webhook_save", args: { courseid: 5, webhookurl: "https://hooks.test/x" } },
        ]);
    });
});

describe("fuera de Moodle (mock)", () => {
    it("historial, secciones y onboarding devuelven datos de ejemplo del curso", async () => {
        // Act.
        const sessions = await history.listSessions({ courseId: 8 });
        const messages = await history.getSessionMessages({ courseId: 8, sessionId: "s9" });
        const deleted = await history.deleteSession({ courseId: 8, sessionId: "s9" });
        const sections = await listCourseSections(8);
        const setup = await withFakeTimers(() => onboarding.getCourseSetupState(8));
        const state = await withFakeTimers(() => onboarding.getOnboardingState(8));
        const saved = await withFakeTimers(() => onboarding.setOnboardingState(8, { dismissed: true }));

        // Assert.
        expect(sessions.sessions.every((s) => s.course_id === 8)).toBe(true);
        expect(messages.session_id).toBe("s9");
        expect(deleted).toEqual({ success: true });
        expect(sections[0]).toEqual({ section: 0, name: "General" });
        expect(setup.courseid).toBe(8);
        expect(state).toMatchObject({ courseid: 8, dismissed: false });
        expect(saved).toEqual({ success: true });
    });

    it("la búsqueda vacía se rechaza y los filtros acotan los resultados de ejemplo", async () => {
        // Act.
        const all = await withFakeTimers(() => searchMaterial({ query: "x", courseId: 1 }));
        const unit1 = await withFakeTimers(() => searchMaterial({ query: "x", courseId: 1, section: 1 }));
        const noUnit = await withFakeTimers(() => searchMaterial({ query: "x", courseId: 1, sectionUnassigned: true }));
        const pptx = await withFakeTimers(() => searchMaterial({
            query: "x", courseId: 1, materialType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }));

        // Assert.
        await expect(searchMaterial({ query: "   ", courseId: 1 })).rejects.toThrow(/empty/);
        expect(unit1.results.every((r) => r.section === 1)).toBe(true);
        expect(noUnit.results.every((r) => r.section == null)).toBe(true);
        expect(pptx.total).toBeLessThan(all.total);
    });

    it("alertas, feed, calendario, resumen y webhook usan sus valores de ejemplo", async () => {
        // Act.
        const withAlert = await withFakeTimers(() => alerts.saveCalendarAlert({ courseId: 1, daysBefore: 3 }));
        const noAlert = await withFakeTimers(() => alerts.saveCalendarAlert({ courseId: 1, daysBefore: 0 }));
        const list = await withFakeTimers(() => alerts.listCalendarAlerts(1, 1));
        const url = await withFakeTimers(() => alerts.getCalendarFeedUrl(4));
        const revoked = await withFakeTimers(() => alerts.revokeCalendarFeed(4));
        const events = await withFakeTimers(() => getUpcomingEvents(1, 1));
        const digest = await withFakeTimers(() => forum.getWeeklyDigest(3, 14));
        await withFakeTimers(() => forum.saveForumWebhook(3, "https://hooks.test/y"));
        const webhook = await withFakeTimers(() => forum.getForumWebhook(3));

        // Assert.
        expect(withAlert.id).toBe("mock-id");
        expect(noAlert.id).toBeNull();
        expect(Array.isArray(list)).toBe(true);
        expect(url).toContain("course=4");
        expect(revoked).not.toBe(url);
        expect(events.every((e) => e.timesort <= Math.floor(Date.now() / 1000) + 86400)).toBe(true);
        expect(digest).toMatchObject({ course_id: 3, period_days: 14 });
        expect(webhook).toBe("https://hooks.test/y");
    });
});
