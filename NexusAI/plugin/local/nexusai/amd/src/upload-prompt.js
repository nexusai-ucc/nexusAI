// This file is part of the NexusAI plugin for Moodle.
//
// Muestra un modal de confirmación al docente cuando sube un archivo a una
// sección del curso (fuera de la interfaz de NexusAI). El docente puede elegir
// indexarlo en NexusAI o ignorarlo.
//
// Cargado solo para usuarios con local/nexusai:manage (docentes/gestores).

define([
    'core/ajax',
    'core/modal_factory',
    'core/modal_events',
    'core/str',
    'core/notification',
], function(Ajax, ModalFactory, ModalEvents, Str, Notification) {

    /**
     * Muestra el modal de confirmación para un archivo pendiente.
     * Devuelve una Promise que resuelve cuando el usuario eligió (sí o no).
     *
     * @param {Object} item  {cmid, filename, mimetype}
     * @param {number} courseid
     * @returns {Promise}
     */
    function promptForItem(item, courseid) {
        return Str.get_strings([
            {key: 'upload_prompt_title',   component: 'local_nexusai'},
            {key: 'upload_prompt_body',    component: 'local_nexusai', param: item.filename},
            {key: 'upload_prompt_yes',     component: 'local_nexusai'},
            {key: 'upload_prompt_no',      component: 'local_nexusai'},
            {key: 'upload_prompt_success', component: 'local_nexusai', param: item.filename},
            {key: 'upload_prompt_error',   component: 'local_nexusai'},
        ]).then(function(strings) {
            var title   = strings[0];
            var body    = strings[1];
            var btnYes  = strings[2];
            var btnNo   = strings[3];
            var msgOk   = strings[4];
            var msgErr  = strings[5];

            return ModalFactory.create({
                type: ModalFactory.types.SAVE_CANCEL,
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
                modal.getRoot().on(ModalEvents.save, function() {
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

                modal.getRoot().on(ModalEvents.cancel, function() {
                    modal.hide();
                    Ajax.call([{
                        methodname: 'local_nexusai_dismiss_pending_upload',
                        args: {cmid: item.cmid},
                    }])[0].catch(function() { /* ignorar error de dismiss */ });
                    resolve();
                });

                // Si el usuario cierra con la X también lo descartamos.
                modal.getRoot().on(ModalEvents.hidden, function() {
                    resolve();
                });
            });
        });
    }

    /**
     * Procesa la lista de pendientes secuencialmente (un modal a la vez).
     *
     * @param {Array}  items     Lista de {cmid, filename, mimetype}
     * @param {number} courseid
     * @returns {Promise}
     */
    function processItems(items, courseid) {
        return items.reduce(function(chain, item) {
            return chain.then(function() { return promptForItem(item, courseid); });
        }, Promise.resolve());
    }

    return {
        /**
         * Punto de entrada cargado por before_footer_listener.php.
         *
         * @param {Object} params  {courseid}
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
                // Fallo silencioso: no interrumpir la experiencia del docente.
            });
        },
    };
});
