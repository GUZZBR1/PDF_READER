type UploadPlaceholderProps = {
  buttonLabel?: string;
};

export default function UploadPlaceholder({
  buttonLabel = "Choose files",
}: UploadPlaceholderProps) {
  return (
    <section className="upload-panel" aria-label="Upload placeholder">
      <div className="upload-placeholder">
        <div className="upload-placeholder-inner">
          <div className="upload-icon" aria-hidden="true">
            PDF
          </div>
          <div>
            <h2>Upload area</h2>
            <p>
              File selection and processing controls will be enabled when the API
              integration is added.
            </p>
          </div>
          <button className="placeholder-button" type="button" disabled>
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
