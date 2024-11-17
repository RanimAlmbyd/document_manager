# Copyright (c) 2024, EBXTech and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class DocumentManagerDoctype(Document):
	
	def before_insert(self):
		self.create_client_script()
		self.create_server_script()
		
	def on_trash(self):
		self.delete_client_server_scripts()

	def create_client_script(self):
		client_script = """frappe.ui.form.on(\'{0}\',{{
			setup(frm){{
				frappe.ui.form.Attachments = class Attachments  extends frappe.ui.form.Attachments {{
					make() {{
					var me = this;
					this.parent.find(".add-attachment-btn").click(function () {{
							document.fetchFileNames(frm).then((fileNames)=>{{
								fileNames.push("Upload Another Document")
								if(fileNames){{
									document.openUploadDialog(frm,fileNames)
								}}else{{
									document.openUploadDialog(frm,[])
								}}
								
							}})
					}});
					this.parent.find(".explore-link").click(() => {{
						if (!this.frm.attachments.get_attachments()?.length) return;
						frappe.open_in_new_tab = true;
						frappe.set_route("List", "File", {{
							attached_to_doctype: this.frm.doctype,
							attached_to_name: this.frm.docname,
						}});
					}});
			
					this.add_attachment_wrapper = this.parent.find(".attachments-actions");
					this.attachments_label = this.parent.find(".attachments-label");
				}}
				}}
			}},
		}})""".format(self.dm_doctype)
		doc = frappe.get_doc({
				"doctype": "Client Script",
				"__newname": f"Document Manager {self.dm_doctype}",
				"module" : "Document Manager",
				"dt": self.dm_doctype,
				"enabled": True,
				"script": client_script
			})
		doc.save()

	def create_server_script(self):
		server_script =  "\nfrappe.call( \"document_manager.document_manager.apis.validat_req_document_tr\",\n   doc_type = doc.doctype ,doc_name = doc.name\n);\n\n"
		doc = frappe.get_doc({
			"doctype": "Server Script",
			"__newname": f"Document Manager {self.dm_doctype}",
			"module" : "Document Manager",
			"script_type":"DocType Event",
			"reference_doctype": self.dm_doctype,
			"doctype_event":"Before Submit",
			"disabled": False,
			"script":server_script
		})
		doc.save()

	def delete_client_server_scripts(self):
		client_script = frappe.get_list("Client Script", filters={"dt":self.dm_doctype},fields=["name"])
		frappe.delete_doc('Client Script', client_script[0].name)
		client_script = frappe.get_list("Server Script", filters={"reference_doctype":self.dm_doctype},fields=["name"])
		frappe.delete_doc('Server Script', client_script[0].name)