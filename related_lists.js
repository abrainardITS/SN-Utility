var TABLE_NAME = 'cmdb_ci_ot';
var DEFAULT_VIEW_NAME = "Default View";
var VIEW_NAME = 'SG-Otorio';
var VIEW_SYS_ID = 'b34c3d5a1b16b110396feb10604bcb66'; //sys_id of the SG-Otorio View record

var rl1sysId = createRelatedListDefinition(TABLE_NAME, VIEW_SYS_ID);

var rlData = lookupRelatedListEntries(TABLE_NAME, DEFAULT_VIEW_NAME, true);
gs.info(rlData);


for (var i = 0; i < rlData.length; i++) {
    createRelatedListEntry(rl1sysId, rlData[i].related_list, rlData[i].position);
}



function createRelatedListDefinition(table_name, view_sys_id) {
    var rlGr = new GlideRecord('sys_ui_related_list');
    rlGr.setValue('name', table_name);
    rlGr.setValue('view', view_sys_id);
    var rlSysId = rlGr.update();
    return rlSysId;
}

/**
 * 
 * @param {*} tableName 
 * @param {*} viewName 
 * @param {*} addKeyValueV2 
 * @returns 
 */
function lookupRelatedListEntries(tableName, viewName, addKeyValueV2) {
    var rlGr = new GlideRecord('sys_ui_related_list');
    rlGr.addQuery('name', tableName);
    rlGr.addQuery('view', viewName);
    rlGr.setLimit(1);
    rlGr.query();
    if (rlGr.next()) {

        var arr = [];

        var rlEntryGr = new GlideRecord('sys_ui_related_list_entry');
        rlEntryGr.addQuery('list_id', rlGr.getUniqueValue());
        rlEntryGr.orderBy('position');
        rlEntryGr.query();
        while (rlEntryGr.next()) {
            arr.push({
                "related_list": rlEntryGr.getValue('related_list'),
                "position": rlEntryGr.getValue('position')
            })
        }

        if (addKeyValueV2) {
            arr.push({
                "related_list": "REL:3089c0301b563550396feb10604bcbdf",
                "position": arr.length
            })
        }

        return arr;
    }
}

function createRelatedListEntry(listID, relatedList, position) {

    var newRlGr = new GlideRecord('sys_ui_related_list_entry');
    newRlGr.initialize();
    newRlGr.setValue('list_id', listID);
    newRlGr.setValue('related_list', relatedList);
    newRlGr.setValue('position', position);
    newRlGr.update();
}