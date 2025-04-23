module.exports = {
  isOwner(message) {
    return message.author.id === process.env.OWNER_ID;
  }
};