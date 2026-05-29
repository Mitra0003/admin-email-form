const form = document.querySelector("#adminForm");
const submitButton = document.querySelector("#submitButton");
const message = document.querySelector("#formMessage");

const fields = {
  name: document.querySelector("#nameInput"),
  address: document.querySelector("#addressInput"),
  consent: document.querySelector("#consentInput")
};

const errors = {
  name: document.querySelector("#nameError"),
  address: document.querySelector("#addressError")
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  if (!fields.consent.checked) {
    setMessage("Centang persetujuan sebelum mengirim.", "error");
    return;
  }

  submitButton.disabled = true;
  setMessage("Mengirim data...");

  try {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: fields.name.value,
        address: fields.address.value
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      showFieldErrors(payload.errors || {});
      throw new Error(payload.message || "Data gagal dikirim.");
    }

    window.location.href = "/confirmation.html";
  } catch (error) {
    setMessage(error.message || "Data gagal dikirim.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

function showFieldErrors(nextErrors) {
  for (const [field, text] of Object.entries(nextErrors)) {
    if (errors[field]) {
      errors[field].textContent = text;
    }
  }
}

function clearErrors() {
  Object.values(errors).forEach((node) => {
    node.textContent = "";
  });
}

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `form-message ${type}`.trim();
}
