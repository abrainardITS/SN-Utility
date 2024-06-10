var APP_SYS_ID = 'feec3b7997ae391088ae3e0e6253afe2';

//TODO the sn_codesearch_table could possibly be used to help populate the list of classes to search - although it doesn't include Tables, Dictionary, Properties, etc
var SYS_METADATA_CLASSES = 'sys_script_include,sys_properties,sys_data_source,sysauto,sysauto_script,scheduled_import_set,sn_sec_int_integration,sn_sec_int_impl,sys_ui_page,sys_rest_message,sys_script_fix,db_image';

//gs.info(getAppTablesAndExtensions(APP_SYS_ID));
//gs.info(getAppCustomTableFields(APP_SYS_ID));

gs.info(getSysMetadataDetails(APP_SYS_ID, SYS_METADATA_CLASSES));


function getAppTablesAndExtensions(appSysId) {

    var tableDetailArr = [];

    var grSDO = new GlideRecord('sys_db_object');
    grSDO.addQuery("sys_scope", appSysId);
    grSDO.orderBy('super_class');
    grSDO.query();
    while (grSDO.next()) {
        var tableDetails = '';
        tableDetails += grSDO.getValue('label');
        tableDetails += ' [' + grSDO.getValue('name') + ']\n';

        //get parent table details
        if (!gs.nil(grSDO.getValue('super_class'))) {
            tableDetails += '\t';
            tableDetails += ('Extends: ' + grSDO.super_class.label + ' [' + grSDO.super_class.name + ']\n');
        }

        tableDetailArr.push(tableDetails);

    }

    return tableDetailArr.join('\n');
}

function getAppCustomTableFields(appSysId) {
    var dictionaryDetailArr = [];
    var grSDO = new GlideRecord('sys_db_object');
    grSDO.addQuery("sys_scope", appSysId);
    //keeping this "order by" with the assumption that the dictionary detail will appear in the same table order as the table listing itself
    grSDO.orderBy('super_class');
    grSDO.query();
    while (grSDO.next()) {

        var dictDetails = '';
        dictDetails += grSDO.getValue('label') + ' [' + grSDO.getValue('name') + ']\n';

        var dictGr = new GlideRecord('sys_dictionary');
        dictGr.addQuery('name', grSDO.getValue('name'));

        //don't include the system fields that are a part of every table
        dictGr.addQuery('element', '!=', 'sys_created_by');
        dictGr.addQuery('element', '!=', 'sys_created_on');
        dictGr.addQuery('element', '!=', 'sys_id');
        dictGr.addQuery('element', '!=', 'sys_mod_count');
        dictGr.addQuery('element', '!=', 'sys_updated_by');
        dictGr.addQuery('element', '!=', 'sys_updated_on');

        dictGr.query();

        while (dictGr.next()) {
            //TODO here more dictionary fields could be added, e.g. Column Label, or Type
            dictDetails += '\t' + dictGr.getValue('element') + '\n';
            dictDetails += '\t\tType: ' + dictGr.internal_type.getDisplayValue(); + '\r\n';
            if (dictGr.getValue('internal_type') == 'reference') {
                dictDetails += "\r\n\t\tReference: " + dictGr.reference.getDisplayValue() + ' [' + dictGr.getValue('reference') + ']';
            }

            dictDetails += '\r\n';
        }

        dictionaryDetailArr.push(dictDetails);
    }

    return dictionaryDetailArr.join('\n');
}

function getSysMetadataDetails(appSysId, classList) {

    var classArr = classList.split(',');
    var metadataArr = [];

    for (var i = 0; i < classArr.length; i++) {

        var metadataForClass = '';


        var grSM = new GlideRecord('sys_metadata');
        grSM.addQuery('sys_scope', appSysId);
        grSM.addQuery('sys_class_name', classArr[i]);
        grSM.orderBy('sys_name');
        grSM.query();
        if (grSM.getRowCount() > 0) {
            metadataForClass += classArr[i] + '\n';
            while (grSM.next()) {
                metadataForClass += grSM.getValue('sys_name') + '\n';

            }

            metadataArr.push(metadataForClass);
        }


    }


    return metadataArr.join('\n');
}