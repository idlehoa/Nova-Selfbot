/**
 * SPECIAL: NamKhanh
 * Nếu user hỏi về "namkhanh là ai", "namkhanh như thế nào" hoặc các biến thể, kể cả hỏi chêm chêm, đảo thứ tự, thêm từ, AI sẽ trả về câu chế diễu.
 */

function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Kết hợp AI để nhận diện ý định hỏi về "NamKhanh là ai/như thế nào"
function namKhanhSpecial(userMessage, aiOriginalReply) {
  // (1) Xử lý đơn giản trước: bỏ dấu, chuẩn hóa về thường, bỏ ký tự đặc biệt
  var normalized = removeDiacritics(userMessage)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Đảm bảo các cách viết Nam Khanh đều về "namkhanh"
  normalized = normalized.replace(/\bnam\s*khanh\b/g, "namkhanh");

  // (2) AI detection (simple LLM prompt)
  // Nếu câu hỏi chứa từ "namkhanh" và có dấu hỏi hoặc một số từ chỉ hỏi thì nghi ngờ hỏi về Nam Khanh là ai/như thế nào
  if (
    normalized.indexOf("namkhanh") !== -1 &&
    (
      /\bla\b|\bai\b|\bgi\b|\bthe nao\b|\bra sao\b|\bnguoi\b|\btinh cach\b|\bchat luong\b|\bthang\b|\bdua\b/.test(normalized)
      || userMessage.indexOf("?") !== -1
    )
  ) {
    // (3) Có thể dùng AI để phân tích thêm: (giả lập)
    // Ví dụ: Gọi ra một số câu chế diễu, chọn ngẫu nhiên 2-3 câu ghép lại
    var insults = [
      "Stupid, brainrot.",
      "A clown with no brain.",
      "Certified meme lord of the underworld.",
      "Nói chung là thiếu muối.",
      "IQ under maintenance.",
      "Bảo tàng động vật quý hiếm.",
      "Tấu hài không điểm dừng.",
      "Đỉnh cao của sự... chậm hiểu.",
      "Sự kết hợp giữa sự ngớ ngẩn và sự tự tin.",
      "Một phiên bản lỗi của loài người.",
      "Chỉ số EQ âm vô cực.",
      "IQ ẩn, cần tìm kính lúp.",
      "AI cũng bó tay, chịu rồi.",
      "Nếu bạn hỏi AI về NamKhanh, AI cũng phải cạn lời.",
    ];
    // Chọn ngẫu nhiên 2-3 câu
    var shuffled = insults.sort(function() { return 0.5 - Math.random(); });
    var count = Math.floor(Math.random() * 2) + 2;
    var reply = shuffled.slice(0, count).join(' ');
    return reply;
  }

  // Nếu không, trả về AI gốc
  return aiOriginalReply;
}

module.exports = {
  namKhanhSpecial: namKhanhSpecial
};