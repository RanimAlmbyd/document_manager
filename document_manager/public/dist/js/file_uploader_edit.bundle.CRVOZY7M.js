(() => {
  // ../document_manager/document_manager/public/js/file_uploader_edit.bundle.js
  frappe.ui.FileUploader = class FileUploader extends frappe.ui.FileUploader {
    make_dialog(title) {
      this.dialog = new frappe.ui.Dialog({
        title: title || __("Newttttttt"),
        primary_action_label: __("Upload"),
        primary_action: () => this.upload_files(),
        secondary_action_label: __("Set all private"),
        secondary_action: () => {
          this.uploader.toggle_all_private();
        },
        on_page_show: () => {
          this.uploader.wrapper_ready = true;
        }
      });
      this.wrapper = this.dialog.body;
      this.dialog.show();
      this.dialog.$wrapper.on("hidden.bs.modal", function() {
        $(this).data("bs.modal", null);
        $(this).remove();
      });
    }
  };
})();
//# sourceMappingURL=file_uploader_edit.bundle.CRVOZY7M.js.map
