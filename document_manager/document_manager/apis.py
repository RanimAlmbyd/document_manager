import frappe
import frappe.utils
 



@frappe.whitelist()
def get_not_uploaded_documents(doctype,docname):
	all_documents = get_documents_for_transection(doctype,docname)
	uploaded_documents = get_uploaded_documents(doctype,docname)
	filtered_documents = [document for document in all_documents if document.name not in uploaded_documents and document.status != "c"]
	return filtered_documents

@frappe.whitelist()
def get_all_documents_for_transection(doctype,docname):
	all_documents = get_documents_for_transection(doctype,docname)
	documents = [document for document in all_documents if document.status != "c"]
	uploaded_documents = get_uploaded_documents(doctype,docname)
	for document in documents:
		if document.name in uploaded_documents:
			document.status = "g"
	other_files = []
	documents_name =[document.name for document in documents]
	for uploaded_document in uploaded_documents:
		if uploaded_document not in documents_name:
			other_files.append(uploaded_document)
	return documents,other_files

def get_documents_for_transection(doctype,docname):
	documents_doctype = frappe.db.get_list("Document Manager Doctype",
		filters={"dm_doctype":doctype},fields=["name"])
	documents = frappe.db.get_all("Document Manager Doctype Detail",
		filters={"parent":documents_doctype[0].name},
		fields=["name","document_name","is_required","conditions"])
	doc = frappe.get_doc(doctype,docname)
	for docs in documents:
		if docs.conditions :
			if docs.is_required == 1 and eval(docs.conditions):
				docs["status"] = "R"
			elif docs.is_required == 0 and eval(docs.conditions):
				docs["status"] = "Y"
			else:
				docs["status"] = "c"
		elif docs.is_required == 1:
				docs["status"] = "R"
		else:
			docs["status"] = "Y"		
	return documents

def get_uploaded_documents(doctype,docname):
	uploaded_documents = frappe.get_list("File",filters={"attached_to_doctype":doctype,"attached_to_name":docname},fields=["name","custom_document_manager_doctype_detail_id"])
	uploaded_document_names = {uploaded_document.custom_document_manager_doctype_detail_id for uploaded_document in uploaded_documents}
	return uploaded_document_names

@frappe.whitelist()
def validat_req_document_tr(doc_type , doc_name):
    documents = get_not_uploaded_documents(doc_type, doc_name)
    for document in documents:
        if document.status == "R":
            frappe.throw(f"There is a required document not uploaded: {document.document_name}")

