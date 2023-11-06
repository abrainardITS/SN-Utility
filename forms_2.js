var VIEW_NAME = "SG-Otorio";
//var TABLE_NAME = 'cmdb_ci_ot_control';

var OTtables = "cmdb_ci_ot,cmdb_ci_ot_cnc,cmdb_ci_ot_control,cmdb_ci_ot_control_module,cmdb_ci_ot_dcs,cmdb_ci_ot_dpu,cmdb_ci_ot_ews,cmdb_ci_ot_field_device,cmdb_ci_ot_historian,cmdb_ci_ot_hmi,cmdb_ci_ot_ied,cmdb_ci_ot_industrial_3d_printer,cmdb_ci_ot_industrial_actuator,cmdb_ci_ot_industrial_drive,cmdb_ci_ot_industrial_robot,cmdb_ci_ot_industrial_sensor,cmdb_ci_ot_isa_entity,cmdb_ci_ot_opc_client,cmdb_ci_ot_opc_server,cmdb_ci_ot_plc,cmdb_ci_ot_rtu,cmdb_ci_ot_scada_client,cmdb_ci_ot_scada_server,cmdb_ci_ot_supervisory";

var tableArr = OTtables.split(',');


for (var i = 0; i < tableArr.length; i++) {
    process(VIEW_NAME, tableArr[i]);
}


function process(VIEW_NAME, TABLE_NAME) {
    var viewGr = new GlideRecord('sys_ui_view');
    var viewSysId;
    if (viewGr.get('name', VIEW_NAME)) {
        viewSysId = viewGr.getUniqueValue();
    } else {
        viewGr.initialize();
        viewGr.setValue('name', VIEW_NAME.toLowerCase());
        viewGr.setValue('title', VIEW_NAME);
        viewSysId = viewGr.update();
    }

    //create the form
    var formSysID = createForm(viewSysId, TABLE_NAME);

    //create sys UI form section (definition)
    var otAssetSectionSysID = createSysUIFormSection(viewSysId, TABLE_NAME, '');
    additionalInfoSectionSysID = createSysUIFormSection(viewSysId, TABLE_NAME, 'Additional Information');

    //create form section ('instance' of the section(s) created above, so to speak)
    createFormSection(otAssetSectionSysID, formSysID, 0);
    createFormSection(additionalInfoSectionSysID, formSysID, 1);

    //get data for the OT asset fields section, which has no name
    var OTAssetSectionData = getElementsForSection('', TABLE_NAME, 'Default View', '');
    //get data for the "Additional Information section"
    var additionalInfoSectionData = getElementsForSection('', TABLE_NAME, 'Default View', 'Additional Information');

    for (var i = 0; i < OTAssetSectionData.length; i++) {
        createSectionElement(otAssetSectionSysID, OTAssetSectionData[i]);
    }

    for (var i = 0; i < additionalInfoSectionData.length; i++) {
        createSectionElement(additionalInfoSectionSysID, additionalInfoSectionData[i]);
    }
}



//////////////// helper functions ///////////////////
/**
 * 
 * @param {*} viewSysId the View that the form belongs to
 * @param {*} tableName the Table the view is for
 * @returns the sys_id of the newly created form
 */
function createForm(viewSysId, tableName) {
    //create form record
    var grSysUiForm = new GlideRecord('sys_ui_form');
    grSysUiForm.initialize();

    grSysUiForm.setValue('view', viewSysId);
    grSysUiForm.setValue('name', tableName);

    var formSysId = grSysUiForm.update();
    return formSysId;
}

/**
 * This is the "Definition" of the Form Section
 * @param {*} viewSysId the View the form section belongs to
 * @param {*} tableName the Table the Form Section is for
 * @param {*} caption Optional. Title at the top of the form section e.g. "Additional Information"
 * @returns the sys_id of the Form Section
 */
function createSysUIFormSection(viewSysId, tableName, caption) {
    var grSUS = new GlideRecord('sys_ui_section');

    grSUS.setValue('view', viewSysId);
    grSUS.setValue('name', tableName);
    grSUS.setValue('caption', caption);
    var sysId = grSUS.update();
    return sysId;

}


/**
 * This is an "Instance" of a Form Section (sys_ui_section), it is linked to an actual Form record
 * @param {*} sysUISectionSysId the "Form Definition"; sys_id of a Form Section [sys_ui_section] record
 * @param {*} sysUIFormSysID sys_id of the Form [sys_ui_form] record
 * @param {*} position Like an "Order" field. e.g. 0, 1
 * @param {*} tableName The table the parent Form is for
 * @returns the sys_id of the newly created Form Section "instance"
 */
function createFormSection(sysUISectionSysId, sysUIFormSysID, position, tableName) {
    var grSUFS = new GlideRecord('sys_ui_form_section');
    grSUFS.initialize();
    grSUFS.setValue('sys_ui_section', sysUISectionSysId);
    grSUFS.setValue('sys_ui_form', sysUIFormSysID);
    grSUFS.setValue('position', position);


    var sysId = grSUFS.update();
    return sysId;
}

/**
 * This will put an actual field/splitter/formatter/etc. onto a Form Section within a Form.
 * @param {*} sys_ui_section sys_id of the "Form Definition" Form Section [sys_ui_section]
 * @param {*} elementJSON a JSON object with sys_ui_element fields. 
 * 
 * Example of elementJSON (normal field):
 * {
 *   "element": "firmware_version",
 *   "position": "3",
 *   "type": null,
 *   "sys_ui_section": "0a895424c377301092c567340440dd13",
 *   "sys_ui_formatter": null
 * }
 * 
 * Another example (CI Relations):
 * 
 *   {
 *   "element": "ui_ng_relation_formatter.xml",
 *   "position": "18",
 *   "type": "formatter",
 *   "sys_ui_section": "0a895424c377301092c567340440dd13",
 *   "sys_ui_formatter": "b62309137f32310009fedf92bdfa912b"
 * }
 * 
 * Example of splits. "element" values are .begin_split, .split, .end_split
 *  {
 *  "element": ".split",
 *   "position": "8",
 *   "type": ".split",
 *   "sys_ui_section": "0a895424c377301092c567340440dd13",
 *   "sys_ui_formatter": null
  }
 */
function createSectionElement(sys_ui_section, elementJSON) {
    var grSUE = new GlideRecord('sys_ui_element');

    grSUE.setValue('sys_ui_section', sys_ui_section);
    grSUE.setValue('position', elementJSON['position']);
    grSUE.setValue('type', elementJSON['type']);
    grSUE.setValue('element', elementJSON['element']);
    grSUE.setValue('sys_ui_formatter', elementJSON['sys_ui_formatter']);

    grSUE.update();

}

/**
 * 
 * @param {*} sys_ui_section The "Section Definition" Form Section [sys_ui_section] you want to find the element/field layout for
 * @param {*} tableName The Table the Section is for
 * @param {*} viewName Which view to lookup, e.g. "Default View"
 * @returns a JSON array containing the elements of the Form Section for the given params
 * 
 * Example usage
 * getElementsForSection('0a895424c377301092c567340440dd13', 'cmdb_ci_ot', 'Default View', 'Additional Information')
 */
function getElementsForSection(sys_ui_section, tableName, viewName, caption) {
    var gr = new GlideRecord('sys_ui_element');
    if (!gs.nil(sys_ui_section)) {
        gr.addQuery('sys_ui_section', sys_ui_section);
    } else {
        gr.addQuery('sys_ui_section.view.title', viewName);
        gr.addQuery('sys_ui_section.name', tableName);
        gr.addQuery('sys_ui_section.caption', caption);
    }

    gr.query();

    var arr = [];
    while (gr.next()) {
        arr.push({

            "element": gr.getValue('element'),
            "position": gr.getValue('position'),
            "type": gr.getValue('type'),
            "sys_ui_section": gr.getValue('sys_ui_section'),
            "sys_ui_formatter": gr.getValue('sys_ui_formatter')
        });
    }
    
    return arr;
}

