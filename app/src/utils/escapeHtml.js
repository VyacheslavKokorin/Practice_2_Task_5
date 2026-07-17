const htmlCharacters = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => htmlCharacters[character]);
}

module.exports = escapeHtml;
