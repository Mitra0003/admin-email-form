export function validateSubmission(payload) {
  const errors = {};

  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: { form: "Data tidak valid." } };
  }

  const name = normalizeText(payload.name);
  const address = normalizeText(payload.address);

  if (name.length < 2) {
    errors.name = "Nama minimal 2 karakter.";
  } else if (name.length > 80) {
    errors.name = "Nama maksimal 80 karakter.";
  }

  if (!address) {
    errors.address = "Alamat wajib diisi.";
  } else if (address.length > 240) {
    errors.address = "Alamat maksimal 240 karakter.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      address
    }
  };
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}
