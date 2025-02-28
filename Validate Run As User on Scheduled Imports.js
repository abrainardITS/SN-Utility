/**
 * Script to validate 'Run As' user configuration for Scheduled Import Sets
 * 
 * Author: Aaron Brainard
 * 
 * Purpose:
 * This script checks all scheduled import sets in the system with the specified sys_scope (APP_SYS_ID).
 * For each scheduled import set, it verifies that a valid 'Run As' user is configured. 
 * If no 'Run As' user is set or if the user does not have the 'import_admin' role, the script logs an information message.
 * 
 * Use Case:
 * This script is intended to ensure that scheduled import sets are configured with the correct 'Run As' user
 * and that the user has the necessary permissions to run the import operations.
 */

var APP_SYS_ID = "2c7cf7921b291810993e0feddc4bcb79";

var scheduledImportGr = new GlideRecord('scheduled_import_set');
scheduledImportGr.addQuery('sys_scope', APP_SYS_ID);
scheduledImportGr.query();
while (scheduledImportGr.next()) {
	var runAsUser = scheduledImportGr.getValue('run_as');
	if (gs.nil(runAsUser)) {
		gs.info(scheduledImportGr.getDisplayValue() + " does not have a Run As user configured: " + scheduledImportGr.getLink());
	} else {
		var userRolesGr = new GlideRecord('sys_user_has_role');
		userRolesGr.addQuery('user', runAsUser);
		userRolesGr.addQuery('role.name', 'import_admin');
		userRolesGr.query();
		if (!userRolesGr.hasNext()) {
			gs.info(scheduledImportGr.getDisplayValue() + " the Run As user does not have the import_admin role: " + scheduledImportGr.getLink());
		}
	}
}
