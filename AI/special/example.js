/**
 * SPECIAL FUNCTION TEMPLATE / MẪU NGOẠI LỆ
 *
 * Quy ước:
 * - Hàm nhận (userMessage, aiOriginalReply)
 * - Trả về chuỗi mới nếu muốn thay thế phản hồi gốc, hoặc trả về aiOriginalReply nếu không muốn thay đổi
 *
 * Ví dụ: Nếu message có từ "ping", trả về "pong!"
 */
function exampleSpecialCase(userMessage, aiOriginalReply) {
  if (/ping/i.test(userMessage)) {
    return "pong!";
  }
  return aiOriginalReply;
}

/**
 * Bạn có thể tạo nhiều file .js khác trong special/ với nhiều function (mỗi function cho 1 rule).
 * Tất cả sẽ tự động được nạp vào AIManager.
 *
 * Quy tắc function:
 *   - Tham số 1: userMessage (string)
 *   - Tham số 2: aiOriginalReply (string)
 *   - Return: string (kết quả cuối cùng)
 */

module.exports = {
  exampleSpecialCase: exampleSpecialCase
};