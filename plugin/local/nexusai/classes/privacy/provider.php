<?php
namespace local_nexusai\privacy;

use core_privacy\local\metadata\collection;

class provider implements
    \core_privacy\local\metadata\provider {

    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('local_nexusai_messages', [
            'userid'      => 'privacy:metadata:messages:userid',
            'courseid'    => 'privacy:metadata:messages:courseid',
            'message'     => 'privacy:metadata:messages:message',
            'timecreated' => 'privacy:metadata:messages:timecreated',
        ], 'privacy:metadata:messages');

        $collection->add_external_location_link('llm_provider', [
            'query'   => 'privacy:metadata:llm:query',
            'context' => 'privacy:metadata:llm:context',
        ], 'privacy:metadata:llm');

        return $collection;
    }
}
