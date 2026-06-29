class ErrorHandler {
  static show(inputElement, message) {
    this.clearAll();

    const formGroup = inputElement.closest(
      ".form-group, .form-group--password",
    );

    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.style.cssText =
      "color:#dc3545;font-size:10px;margin-top:4px;font-family:'DM Sans',sans-serif;";

    formGroup.appendChild(errorDiv);
    inputElement.style.borderColor = "#dc3545";
  }

  static clearAll() {
    document.querySelectorAll(".error-message").forEach((el) => el.remove());
    document
      .querySelectorAll(".input-field")
      .forEach((el) => (el.style.borderColor = "#d1d5db"));
  }

  static wrapPromise(promise) {
    return promise.catch((error) => {
      console.error("Operation failed:", error);
      throw error;
    });
  }
}

export default ErrorHandler;
