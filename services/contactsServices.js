import Contact from "../db/models/Contact.js";

export async function listContacts() {
  return Contact.findAll();
}

export async function getContactById(contactId) {
  return Contact.findByPk(contactId);
}

export async function removeContact(contactId) {
  const contact = await getContactById(contactId);
  if (!contact) {
    return null;
  }

  await contact.destroy();
  return contact;
}

export async function addContact(data) {
  return Contact.create(data);
}

export async function updateContactById(contactId, body) {
  const [rows, updateContact] = await Contact.update(body, {
    where: {
      id: contactId,
    },
    returning: true,
  });

  return rows ? updateContact[0] : null;
}
export async function updateStatusContact(contactId, body) {
  return updateContactById(contactId, body);
}
