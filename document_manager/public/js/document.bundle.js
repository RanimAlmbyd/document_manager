
frappe.provide("document");
function attachment_uploaded(attachment, frm) {
    if (this.dialog) {
        this.dialog.hide();
    }
    update_attachment(attachment, frm);
    frm.sidebar.reload_docinfo();
    frm.refresh();
    if (frm.doc.attachments) {
        frm.doc.attachments.push(attachment);
        frm.refresh_field('attachments');
    }
}

function update_attachment(attachment, frm) {
    if (attachment.name) {
        add_to_attachments(attachment, frm);
        frm.refresh();
    }
}

function add_to_attachments(attachment, frm) {
    var form_attachments = get_attachments(frm);
    for (var i in form_attachments) {
        if (form_attachments[i]["name"] === attachment.name) return;
    }
    form_attachments.push(attachment);
}

function get_attachments(frm) {
    return frm.get_docinfo().attachments || [];
}
document.fetchFileNames = function(frm){
    return new Promise((resolve, reject) => {
        frappe.call({
                method:"document_manager.document_manager.apis.get_not_uploaded_documents",
                args:{
                    "doctype":frm.doc.doctype,
                    "docname":frm.doc.name,
                }
            }).then((res)=>{
                if(res.message){
                    let fileNames = res.message.map(ele => ele.name);
                    resolve(fileNames);
                }
            })
    })
}

function renderFileCard(d,frm){
    frappe.call({
        method:"document_manager.document_manager.apis.get_all_documents_for_transection",
        args:{
            "doctype":frm.doc.doctype,
            "docname":frm.doc.name,
        }
    }).then((res)=>{
        const documents = res.message[0]
        const otherFiles = res.message[1]
        const htmlContent = `
        <head>
            <style>
                .contentcard { display: flex;flex-wrap: wrap;width: 100%;padding: 15px;justify-content: flex-end;background-color: #f3f3f350;border-radius: 8px;flex-direction: row-reverse;}
                .item { display: flex;align-items: center;width: calc(93% / 3);margin-bottom: 10px;font-size: 13px;}
                .circle {width: 12px;height: 12px;border-radius: 50%;margin-right: 10px;}
                .greendashbord { background-color: #30a66d; }
                .reddashbord { background-color:#cc2929; }
                .yellowdashbord { background-color: #f5e171; }
            </style>
        </head>
        <div class="contentcard">
            ${documents.map((ele)=>`<div class="item"><div class="circle ${ele.status == "R" ? "reddashbord" :ele.status == "Y" ? "yellowdashbord" : "greendashbord"}"></div>${ele.document_name}</div>`).join('')}
        </div>`
        const htmlContentOtherFile = `
        <head>
            <style>
                .contentcard { display: flex;flex-wrap: wrap;width: 100%;padding: 15px;justify-content: flex-end;background-color: #f3f3f350;border-radius: 8px;flex-direction: row-reverse;}
                .item { display: flex;align-items: center;width: calc(93% / 3);margin-bottom: 10px;font-size: 13px;}
                .circle {width: 12px;height: 12px;border-radius: 50%;margin-right: 10px;}
                .bluedashbord{ background-color: #0289f7; }
            </style>
        </head>
        <div class="contentcard">
            ${otherFiles.map((ele)=>`<div class="item"><div class="circle bluedashbord"></div>${ele}</div>`).join('')}
        </div>`
        d.fields_dict['files_html'].$wrapper.html(htmlContent);
        d.fields_dict['other_file_html'].$wrapper.html(htmlContentOtherFile);
    })
}
document.openUploadDialog = function(frm,fileNames){
    let d = new frappe.ui.Dialog({
                title: 'Document Manager Uploader',
                fields: [
                    {   
                        // label: 'Document Manager Uploaded Dashboard',
                        fieldtype: "HTML",
                        fieldname: 'footer_html',
                        options: `
                        <style>
                            .circle {width: 10px;height: 10px;border-radius: 50%;margin-right: 10px;}
                            .greendashbord { background-color: #30a66d;}
                            .reddashbord { background-color:#cc2929;}
                            .yellowdashbord { background-color: #f5e171;}
                            .bluedashbord{ background-color: #0289f7;}
                        </style>
                        <div class="title_upload" style="display:flex;justify-content: space-between;">
                            <div style="font-weight: 600;color:#383838;margin-bottom: 10px;">Document Manager Dashboard</div>
                            <div style="display:flex;color:#383838;font-size: 11px;">
                                <div style="display:flex;padding-right: 10px;"><div class="circle reddashbord" style="margin-right:3px;"></div><div>Required</div></div>
                                <div style="display:flex;padding-right: 10px;"><div class="circle greendashbord" style="margin-right:3px;"></div><div>Uploaded</div></div>
                                <div style="display:flex;padding-right: 10px;"><div class="circle yellowdashbord" style="margin-right:3px;"></div><div>Optional</div></div>
                                <div style="display:flex;"><div class="circle bluedashbord" style="margin-right:3px;"></div><div>Another File</div></div>
                            </div>
                            
                        </div>
                        `,
                    },
                    {
                        fieldtype: 'HTML',
                        fieldname: 'files_html',
                        options: ``,
                    },
                    {   
                        label: 'Another Uploaded Document',
                        fieldtype: "Section Break",
                        hide_border:1
                    },
                    {
                        fieldtype: 'HTML',
                        fieldname: 'other_file_html',
                        options: ``,
                    },
                    {   
                        label: 'Select Document',
                        fieldtype: "Section Break"
                    },
                    {
                        label: 'Document Name',
                        fieldname: 'file_name',
                        fieldtype: 'Select',
                        options:fileNames,
                        onchange:()=>{
                            // If you add another field edit fields[5]
                            if(d.get_value("file_name") == "Upload Another Document"){
                                d.fields[7].hidden = 0;
                            }
                            else{
                                d.fields[7].hidden = 1;
                            }
                            d.fields[8].hidden = 0;
                            d.refresh();
                        }
                    },
                    {
                        label: 'Document Name for Another Attachment(Optional)',
                        fieldname: 'att_name',
                        fieldtype: 'Data',
                        hidden:1,

                    },
                    {
                        label: 'Upload',
                        fieldname: 'file_upload',
                        fieldtype: 'Button',
                        click: () => {
                            new frappe.ui.FileUploader({
                                doctype: frm.doc.doctype,
                                docname: frm.doc.name,
                                frm: frm,
                                folder: "Home/Attachments",
                                allow_multiple:d.get_value("file_name") =="Upload Another Document"? true:false,
                                on_success: (file_doc) => {
                                    attachment_uploaded(file_doc, frm);
                                    if (d.get_value("file_name") != "Upload Another Document"){
                                        frappe.db.set_value('File',file_doc.name,'custom_document_manager_doctype_detail_id', d.get_value("file_name"))
                                    }
                                    else{
                                        if(d.get_value("att_name")){
                                            frappe.db.set_value('File',file_doc.name,'custom_document_manager_doctype_detail_id',d.get_value("att_name"))
                                        }else{
                                            frappe.db.set_value('File',file_doc.name,'custom_document_manager_doctype_detail_id',file_doc.file_name)
                                        }
                                        
                                    }
                                    d.hide()
                                },
                            });
                        },
                        hidden: 1,
                    },
                ],
                size: 'large',
            });
            renderFileCard(d,frm);
            d.show();
}