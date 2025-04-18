var APP_SYS_ID = '054cdcc2ff200200158bffffffffff94';
var EXPORT_AS_CSV = true; // Toggle to enable/disable CSV export
// Metadata classes to pull from sys_metadata
var SYS_METADATA_CLASSES = 'sys_script_include,sys_properties,sys_data_source,sysauto,sysauto_script,scheduled_import_set,sn_sec_int_integration,sn_sec_int_impl,sys_ui_page,sys_rest_message,sys_script_fix,db_image';

// Fields to exclude from dictionary queries (common system fields)
var EXCLUDED_SYS_FIELDS = [
    'sys_created_by',
    'sys_created_on',
    'sys_id',
    'sys_mod_count',
    'sys_updated_by',
    'sys_updated_on'
];

// Execute main function
main();

function main() {
    var scopeGr = new GlideRecord('sys_scope');
    if (scopeGr.get(APP_SYS_ID)) {
        gs.info('=== Scoped Application: ' + scopeGr.getDisplayValue('name') + ' ===');
    } else {
        gs.info('Invalid Application Sys ID');
        return;
    }

    //gs.info('--- Tables & Extensions ---\n' + getAppTablesAndExtensions(APP_SYS_ID));
    //gs.info('--- Custom Table Fields ---\n' + getAppCustomTableFields(APP_SYS_ID));
    gs.info('--- Other Application Files ---\n' + getSysMetadataDetails(APP_SYS_ID, SYS_METADATA_CLASSES));
}

function getAppTablesAndExtensions(appSysId) {
    var tableDetailArr = [];
    var grSDO = new GlideRecord('sys_db_object');
    grSDO.addQuery("sys_scope", appSysId);
    grSDO.orderBy('super_class');
    grSDO.query();

    while (grSDO.next()) {
        var tableDetails = '';
        tableDetails += grSDO.getDisplayValue('label') + ' [' + grSDO.getValue('name') + ']\n';

        if (!gs.nil(grSDO.getValue('super_class'))) {
            tableDetails += '\tExtends: ' + grSDO.super_class.getDisplayValue('label') + ' [' + grSDO.super_class.name + ']\n';
        }

        tableDetailArr.push(tableDetails + '\n');
    }

    return tableDetailArr.join('');
}

function getAppCustomTableFields(appSysId) {
    var dictionaryDetailArr = [];
    var grSDO = new GlideRecord('sys_db_object');
    grSDO.addQuery("sys_scope", appSysId);
    grSDO.orderBy('super_class');
    grSDO.query();

    while (grSDO.next()) {
        var dictDetails = grSDO.getDisplayValue('label') + ' [' + grSDO.getValue('name') + ']\n';

        var dictGr = new GlideRecord('sys_dictionary');
        dictGr.addQuery('name', grSDO.getValue('name'));

        // Build exclusion filter
        var qc = dictGr.addQuery('element', '!=', EXCLUDED_SYS_FIELDS[0]);
        for (var i = 1; i < EXCLUDED_SYS_FIELDS.length; i++) {
            qc.addOrCondition('element', '!=', EXCLUDED_SYS_FIELDS[i]);
        }

        dictGr.query();
        while (dictGr.next()) {
            dictDetails += '\t' + dictGr.getDisplayValue('element') + ' [' + dictGr.getValue('element') + ']\n';
            dictDetails += '\t\tLabel: ' + dictGr.getDisplayValue('column_label') + '\n';
            dictDetails += '\t\tType: ' + dictGr.getDisplayValue('internal_type') + '\n';

            if (dictGr.getValue('internal_type') == 'reference') {
                dictDetails += '\t\tReference: ' + dictGr.getDisplayValue('reference') + ' [' + dictGr.getValue('reference') + ']\n';
            }

            dictDetails += '\n';
        }

        dictionaryDetailArr.push(dictDetails + '\n');
    }

    return dictionaryDetailArr.join('');
}

function getSysMetadataDetails(appSysId, classList) {
    var classArr = classList.split(',');
    var metadataArr = [];
    var missingDescriptionsByClass = {};
    var sysPropWarnings = []; // Warnings specific to system properties

    for (var i = 0; i < classArr.length; i++) {
        var tableName = classArr[i];
        var gr = new GlideRecord(tableName);

        if (!gr.isValid()) {
            metadataArr.push(tableName + ' - Invalid table name\n');
            continue;
        }

        gr.addQuery('sys_scope', appSysId);
        gr.orderBy('sys_name');
        gr.query();

        var count = gr.getRowCount();
        if (count > 0) {
            var metadataForClass = tableName + ' (' + count + ' items)\n';
            var missingDescriptions = [];

            while (gr.next()) {
                var sysName = gr.getValue('sys_name');
                metadataForClass += '\t' + sysName + '\n';

                // === Handle 'description' field ===
                if (gr.isValidField('description')) {
                    var desc = gr.getValue('description');
                    if (desc) {
                        metadataForClass += '\t\tDescription: ' + desc + '\n';
                    } else {
                        missingDescriptions.push(sysName);
                    }
                }

                // === Special handling for sys_properties ===
                if (tableName == 'sys_properties') {
                    var propValue = gr.getValue('value');
                    var propType = gr.getDisplayValue('type');

                    metadataForClass += '\t\tType: ' + propType + '\n';
                    metadataForClass += '\t\tValue: ' + (propValue || '[EMPTY]') + '\n';

                    // Flag properties with missing values or suspicious ones
                    if (!propValue) {
                        sysPropWarnings.push({
                            name: sysName,
                            issue: 'Missing value'
                        });
                    } else if (/password|apikey|token/i.test(sysName) || /https?:\/\//i.test(propValue)) {
                        sysPropWarnings.push({
                            name: sysName,
                            value: propValue,
                            issue: 'Possible sensitive or hardcoded value'
                        });
                    }
                }
            }

            metadataArr.push(metadataForClass + '\n');

            if (missingDescriptions.length > 0) {
                missingDescriptionsByClass[tableName] = missingDescriptions;
            }
        }
    }

    var finalOutput = metadataArr.join('');

    // === Description Warnings ===
    finalOutput += '\n=== Records Missing Descriptions ===\n';
    var classKeys = Object.keys(missingDescriptionsByClass);
    if (classKeys.length === 0) {
        finalOutput += 'All applicable records have descriptions.\n';
    } else {
        for (var j = 0; j < classKeys.length; j++) {
            var className = classKeys[j];
            finalOutput += '\n' + className + ':\n';
            var items = missingDescriptionsByClass[className];
            for (var k = 0; k < items.length; k++) {
                finalOutput += '\t' + items[k] + '\n';
            }
        }
    }

    // === System Property Warnings ===
    finalOutput += '\n=== System Property Warnings ===\n';
    if (sysPropWarnings.length === 0) {
        finalOutput += 'All system properties appear valid.\n';
    } else {
        for (var m = 0; m < sysPropWarnings.length; m++) {
            var warn = sysPropWarnings[m];
            finalOutput += '\t' + warn.name + ': ' + warn.issue;
            if (warn.value) {
                finalOutput += ' (Value: ' + warn.value + ')';
            }
            finalOutput += '\n';
        }
    }

    if (EXPORT_AS_CSV) {
        var csvOutput = [];
        csvOutput.push('Class,Sys Name,Type,Value,Description');

        for (var i = 0; i < classArr.length; i++) {
            var tableName = classArr[i];
            var gr = new GlideRecord(tableName);

            if (!gr.isValid()) {
                continue;
            }

            gr.addQuery('sys_scope', appSysId);
            gr.query();

            while (gr.next()) {
                var sysName = gr.getValue('sys_name');
                var description = gr.isValidField('description') ? gr.getValue('description') : '';
                var value = '';
                var type = '';

                if (tableName == 'sys_properties') {
                    value = gr.getValue('value') || '';
                    type = gr.getDisplayValue('type') || '';
                }

                // Escape double quotes and commas
                function clean(val) {
                    return ('"' + (val || '').replace(/"/g, '""') + '"');
                }

                var row = [
                    clean(tableName),
                    clean(sysName),
                    clean(type),
                    clean(value),
                    clean(description)
                ].join(',');

                csvOutput.push(row);
            }
        }

        finalOutput += '\n=== CSV EXPORT ===\n' + csvOutput.join('\n');
    }


    return finalOutput;
}


