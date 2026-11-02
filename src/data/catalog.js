// Dữ liệu cố định của phòng khám (sau này sẽ lấy từ backend/database)

export const CATS = [
  { id: 'noi', name: 'Nội tổng quát', ic: 'pulse' },
  { id: 'nhi', name: 'Nhi khoa', ic: 'smile' },
  { id: 'san', name: 'Sản phụ khoa', ic: 'heart' },
  { id: 'tmh', name: 'Tai mũi họng', ic: 'ear' },
  { id: 'rang', name: 'Răng hàm mặt', ic: 'tooth' },
  { id: 'xn', name: 'Xét nghiệm & Chẩn đoán hình ảnh', ic: 'flask' },
]

export const SERVICES = [
  { id: 's1', cat: 'noi', name: 'Khám nội tổng quát', dur: 30, price: 150000, hot: 1, desc: 'Bác sĩ hỏi bệnh, khám lâm sàng và hướng dẫn xét nghiệm cần làm khi có triệu chứng.', inc: ['Đo huyết áp, nhịp tim, SpO2', 'Bác sĩ khám và tư vấn trực tiếp', 'Hồ sơ sức khỏe điện tử'] },
  { id: 's2', cat: 'noi', name: 'Khám tim mạch', dur: 30, price: 200000, desc: 'Đánh giá huyết áp, nhịp tim, đau ngực, hồi hộp và nguy cơ tim mạch.', inc: ['Khám tim mạch chuyên khoa', 'Đo điện tim tại chỗ', 'Tư vấn điều trị và theo dõi'] },
  { id: 's3', cat: 'noi', name: 'Khám tiêu hóa', dur: 30, price: 200000, desc: 'Khám đau dạ dày, trào ngược, đầy bụng, rối loạn tiêu hóa kéo dài.', inc: ['Khám tiêu hóa chuyên khoa', 'Tư vấn chế độ ăn', 'Chỉ định xét nghiệm nếu cần'] },
  { id: 's4', cat: 'nhi', name: 'Khám nhi', dur: 30, price: 150000, hot: 1, desc: 'Khám sốt, ho, viêm họng, tiêu hóa và theo dõi tăng trưởng cho trẻ.', inc: ['Cân đo, đánh giá tăng trưởng', 'Bác sĩ nhi khám trực tiếp', 'Hướng dẫn chăm sóc tại nhà'] },
  { id: 's5', cat: 'nhi', name: 'Tư vấn dinh dưỡng trẻ em', dur: 30, price: 120000, desc: 'Đánh giá chế độ ăn, biếng ăn, chậm tăng cân và gợi ý thực đơn theo độ tuổi.', inc: ['Đánh giá cân nặng, chiều cao', 'Gợi ý thực đơn theo tháng tuổi', 'Tư vấn bổ sung vi chất'] },
  { id: 's6', cat: 'san', name: 'Khám phụ khoa', dur: 30, price: 200000, desc: 'Khám phụ khoa định kỳ, tư vấn kế hoạch hóa gia đình và các vấn đề thường gặp.', inc: ['Khám và tư vấn riêng tư', 'Bác sĩ nữ phụ trách', 'Chỉ định xét nghiệm nếu cần'] },
  { id: 's7', cat: 'san', name: 'Siêu âm thai', dur: 30, price: 250000, hot: 1, desc: 'Siêu âm theo dõi sự phát triển của thai nhi và sức khỏe mẹ trong thai kỳ.', inc: ['Siêu âm thai 2D', 'Đo các chỉ số thai nhi', 'Tư vấn của bác sĩ sản'] },
  { id: 's8', cat: 'tmh', name: 'Khám tai mũi họng', dur: 30, price: 150000, desc: 'Khám viêm mũi, viêm xoang, viêm họng, ù tai và các vấn đề về tai mũi họng.', inc: ['Khám tai, mũi, họng', 'Làm sạch ráy tai nhẹ', 'Tư vấn điều trị'] },
  { id: 's9', cat: 'tmh', name: 'Nội soi tai mũi họng', dur: 30, price: 300000, desc: 'Nội soi bằng ống mềm để quan sát rõ mũi, họng, thanh quản.', inc: ['Nội soi ống mềm', 'Hình ảnh lưu trong hồ sơ', 'Bác sĩ giải thích kết quả'] },
  { id: 's10', cat: 'rang', name: 'Khám răng định kỳ', dur: 30, price: 100000, desc: 'Kiểm tra sâu răng, nướu và tư vấn chăm sóc răng miệng hằng ngày.', inc: ['Khám toàn bộ răng, nướu', 'Chụp ảnh răng nội soi', 'Tư vấn vệ sinh răng miệng'] },
  { id: 's11', cat: 'rang', name: 'Lấy cao răng', dur: 45, price: 200000, desc: 'Loại bỏ cao răng và mảng bám bằng máy siêu âm, đánh bóng răng.', inc: ['Cạo vôi siêu âm', 'Đánh bóng bề mặt răng', 'Hướng dẫn dùng chỉ nha khoa'] },
  { id: 's12', cat: 'xn', name: 'Xét nghiệm máu tổng quát', dur: 30, price: 350000, hot: 1, desc: 'Công thức máu, đường huyết, mỡ máu, chức năng gan thận. Thường cần nhịn ăn.', inc: ['Công thức máu, đường huyết', 'Mỡ máu, men gan, chức năng thận', 'Kết quả điện tử trong 24 giờ'] },
  { id: 's13', cat: 'xn', name: 'Siêu âm bụng tổng quát', dur: 30, price: 200000, desc: 'Quan sát gan, mật, tụy, lách, thận và bàng quang bằng siêu âm.', inc: ['Siêu âm gan, mật, tụy, lách, thận', 'Bác sĩ chẩn đoán hình ảnh đọc kết quả', 'Cần nhịn ăn 6 giờ'] },
  { id: 's14', cat: 'xn', name: 'Chụp X-quang ngực', dur: 30, price: 180000, desc: 'Chụp phim phổi để kiểm tra phổi, tim và các bệnh lý hô hấp.', inc: ['Chụp X-quang kỹ thuật số', 'Bác sĩ đọc phim', 'Phim điện tử lưu trong hồ sơ'] },
  { id: 's15', cat: 'xn', name: 'Gói khám sức khỏe tổng quát', dur: 90, price: 1200000, desc: 'Khám lâm sàng kết hợp xét nghiệm máu, nước tiểu, X-quang ngực và siêu âm bụng.', inc: ['Khám nội, đo huyết áp, BMI', 'Xét nghiệm máu và nước tiểu', 'X-quang ngực, siêu âm bụng, tổng kết cùng bác sĩ'] },
]

export const STAFF = [
  { id: 'st1', name: 'BS. CKI Nguyễn Minh Anh', role: 'Bác sĩ nội tổng quát', cats: ['noi'], rating: 4.9, years: 12 },
  { id: 'st2', name: 'BS. CKII Trần Quốc Hưng', role: 'Bác sĩ tim mạch, tiêu hóa', cats: ['noi'], rating: 4.8, years: 15 },
  { id: 'st3', name: 'BS. Lê Thu Hà', role: 'Bác sĩ nhi khoa', cats: ['nhi'], rating: 4.9, years: 10 },
  { id: 'st4', name: 'BS. CKI Phạm Ngọc Lan', role: 'Bác sĩ sản phụ khoa', cats: ['san'], rating: 4.9, years: 13 },
  { id: 'st5', name: 'BS. Đỗ Văn Khánh', role: 'Bác sĩ tai mũi họng', cats: ['tmh'], rating: 4.7, years: 9 },
  { id: 'st6', name: 'BS. Vũ Đức Long', role: 'Bác sĩ răng hàm mặt', cats: ['rang'], rating: 4.9, years: 11 },
  { id: 'st7', name: 'KTV Hoàng Thị Mai', role: 'Kỹ thuật viên xét nghiệm', cats: ['xn'], rating: 4.8, years: 8 },
  { id: 'st8', name: 'BS. Nguyễn Hải Yến', role: 'Bác sĩ chẩn đoán hình ảnh', cats: ['xn'], rating: 4.8, years: 7 },
]

export const VOUCHERS = [
  { code: 'HEN10', title: 'Giảm 10% mọi dịch vụ', type: 'pct', val: 10, max: 100000, min: 200000, cat: null, note: 'Tối đa 100.000đ, cho đơn từ 200.000đ' },
  { code: 'CHAOBAN', title: 'Giảm 30.000đ cho người mới', type: 'fix', val: 30000, max: 30000, min: 150000, cat: null, note: 'Cho đơn từ 150.000đ' },
  { code: 'XN15', title: 'Giảm 15% Xét nghiệm & CĐHA', type: 'pct', val: 15, max: 150000, min: 0, cat: 'xn', note: 'Tối đa 150.000đ' },
  { code: 'NHI10', title: 'Giảm 10% Nhi khoa', type: 'pct', val: 10, max: 50000, min: 0, cat: 'nhi', note: 'Tối đa 50.000đ' },
]

export const FAQ = [
  ['Tôi có thể hủy hoặc đổi lịch không?', 'Bạn đổi hoặc hủy miễn phí trước giờ hẹn ít nhất 2 giờ, ngay trong mục Lịch hẹn của tôi. Sát giờ hơn, vui lòng gọi hotline để được hỗ trợ.'],
  ['Tôi cần mang theo giấy tờ gì?', 'Mang theo CCCD, thẻ bảo hiểm y tế nếu có, cùng đơn thuốc hoặc kết quả khám trước đó (nếu có).'],
  ['Xét nghiệm có cần nhịn ăn không?', 'Xét nghiệm máu tổng quát và siêu âm bụng thường cần nhịn ăn 6 đến 10 giờ. Phòng khám sẽ dặn kỹ khi xác nhận lịch.'],
  ['Nếu đến muộn thì sao?', 'Phòng khám giữ lịch 15 phút. Quá thời gian này, lịch có thể được sắp xếp lại theo bác sĩ còn trống.'],
  ['Thanh toán như thế nào?', 'Bạn thanh toán tại quầy sau khi khám, bằng tiền mặt, thẻ hoặc chuyển khoản. Đặt lịch không cần trả trước.'],
  ['Mã ưu đãi dùng như thế nào?', 'Ở bước Xác nhận khi đặt lịch, nhập mã vào ô Mã ưu đãi rồi bấm Áp dụng. Mỗi lịch hẹn dùng một mã.'],
  ['Tôi không chọn được bác sĩ mong muốn?', 'Khung giờ bị gạch ngang nghĩa là bác sĩ đã kín lịch. Bạn chọn giờ khác hoặc chọn Bất kỳ bác sĩ rảnh để có nhiều giờ trống hơn.'],
  ['Trường hợp khẩn cấp thì sao?', 'Đặt lịch trực tuyến không dành cho cấp cứu. Khi có dấu hiệu nguy hiểm, hãy gọi 115 hoặc đến cơ sở y tế gần nhất ngay.'],
]

// Danh mục lấy từ backend: nạp thẳng vào các mảng ở trên để mọi màn hình dùng chung.
// Nếu backend không trả dữ liệu thì giữ nguyên dữ liệu mẫu ở trên.
export function applyCatalog(res) {
  if (!res || !Array.isArray(res.services) || !res.services.length) return
  const fill = (arr, items) => arr.splice(0, arr.length, ...(items || []))
  fill(CATS, res.categories)
  fill(SERVICES, res.services)
  fill(STAFF, res.staff)
  fill(VOUCHERS, res.vouchers)
}