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
 * Shows a confirmation modal to the teacher after they add a file to a course
 * section (outside the NexusAI interface). The teacher can choose to index it in
 * NexusAI or ignore it.
 *
 * Loaded only for users with local/nexusai:manage (teachers/managers).
 *
 * @module     local_nexusai/upload-prompt
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([
    'core/ajax',
    'core/modal_save_cancel',
    'core/str',
    'core/notification',
], function(Ajax, ModalSaveCancel, Str, Notification) {

    /**
     * Shows the confirmation modal for one pending file.
     * Returns a Promise that resolves when the user has chosen (yes or no).
     *
     * @param {Object} item     {cmid, filename, mimetype}
     * @param {number} courseid Course id.
     * @returns {Promise}
     */
    function promptForItem(item, courseid) {
        return Str.get_strings([
            {key: 'upload_prompt_title',   component: 'local_nexusai'},
            {key: 'upload_prompt_body',    component: 'local_nexusai', param: item.filename},
            {key: 'upload_prompt_yes',     component: 'local_nexusai'},
            {key: 'upload_prompt_no',      component: 'local_nexusai'},
        ]).then(function(strings) {
            var title  = strings[0];
            var body   = strings[1];
            var btnYes = strings[2];
            var btnNo  = strings[3];

            return ModalSaveCancel.create({
                title: title,
                body: body,
                buttons: {
                    save:   btnYes,
                    cancel: btnNo,
                },
            });
        }).then(function(modal) {
            modal.show();

            return new Promise(function(resolve) {
                modal.getRoot().on('modal-save-cancel:save', function() {
                    modal.hide();
                    Ajax.call([{
                        methodname: 'local_nexusai_confirm_pending_upload',
                        args: {courseid: courseid, cmid: item.cmid},
                    }])[0].then(function() {
                        Str.get_string('upload_prompt_success', 'local_nexusai', item.filename)
                            .then(function(msg) { Notification.addNotification({message: msg, type: 'success'}); });
                        resolve();
                    }).catch(function() {
                        Str.get_string('upload_prompt_error', 'local_nexusai')
                            .then(function(msg) { Notification.addNotification({message: msg, type: 'error'}); });
                        resolve();
                    });
                });

                modal.getRoot().on('modal-save-cancel:cancel', function() {
                    modal.hide();
                    Ajax.call([{
                        methodname: 'local_nexusai_dismiss_pending_upload',
                        args: {cmid: item.cmid},
                    }])[0].catch(function() { /* Ignore a failed dismiss. */ });
                    resolve();
                });

                modal.getRoot().on('modal:hidden', function() {
                    resolve();
                });
            });
        });
    }

    /**
     * Processes the pending list sequentially (one modal at a time).
     *
     * @param {Array}  items     List of {cmid, filename, mimetype}.
     * @param {number} courseid  Course id.
     * @returns {Promise}
     */
    function processItems(items, courseid) {
        return items.reduce(function(chain, item) {
            return chain.then(function() { return promptForItem(item, courseid); });
        }, Promise.resolve());
    }

    return {
        /**
         * Entry point loaded by before_footer_listener.php.
         *
         * @param {Object} params {courseid}
         */
        init: function(params) {
            var courseid = params.courseid;

            Ajax.call([{
                methodname: 'local_nexusai_get_pending_uploads',
                args: {courseid: courseid},
            }])[0].then(function(items) {
                if (!items || items.length === 0) {
                    return;
                }
                return processItems(items, courseid);
            }).catch(function() {
                // Silent failure: never interrupt the teacher.
            });
        },
    };
});
