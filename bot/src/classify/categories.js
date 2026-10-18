// Danh mục phân loại. `keywords` dùng cho bộ phân loại từ khoá;
// so khớp không phân biệt hoa thường và dấu tiếng Việt.

export const REGIONS = {
  trung_quoc: {
    label: 'Trung Quốc', tag: 'TrungQuoc',
    keywords: ['trung quốc', 'trung hoa', 'china', 'chinese', '中国', '中國', '道教', 'taoist', 'taoism', '茅山', '湘西', '汉族'],
  },
  viet_nam: {
    label: 'Việt Nam', tag: 'VietNam',
    keywords: ['việt nam', 'vietnam', 'vietnamese', '越南', 'người việt', 'người kinh', 'annam', 'an nam'],
  },
  dan_toc_thieu_so: {
    label: 'Dân tộc thiểu số', tag: 'DanTocThieuSo',
    keywords: ['dân tộc thiểu số', 'ethnic minorit', '少数民族'],
  },
  khac: { label: 'Khác', tag: 'Khac', keywords: [] },
};

export const ETHNIC_GROUPS = {
  "H'Mông / Miêu": ["h'mông", 'hmông', 'hmong', 'người mèo', 'người miêu', 'dân tộc miêu', 'miêu tộc', 'miao', '苗族', '苗疆', '苗蛊'],
  'Thái': ['người thái', 'dân tộc thái', 'thái đen', 'thái trắng', 'tai dam'],
  'Mường': ['người mường', 'dân tộc mường', 'mo mường', 'muong people', 'mường'],
  'Khmer': ['khmer', 'khơ me', 'khơ-me'],
  'Chăm': ['dân tộc chăm', 'văn hoá chăm', 'văn hóa chăm', 'bùa chăm', 'ngải chàm', 'champa', 'chăm pa', 'cham people', '占族'],
  'Tày / Nùng': ['người tày', 'dân tộc tày', 'người nùng', 'dân tộc nùng', 'then tày'],
  'Dao': ['dân tộc dao', 'người dao đỏ', '瑶族', 'yao people'],
  'Choang': ['壮族', 'zhuang', 'choang'],
  'Di': ['彝族', 'yi people', 'người lô lô', 'lolo'],
  'Tây Nguyên': ['ê đê', 'gia rai', 'jarai', 'rhade', 'ba na', 'bahnar', 'xơ đăng', 'tây nguyên'],
};

export const TYPES = {
  bua_yeu: {
    label: 'Bùa yêu', tag: 'BuaYeu',
    keywords: ['bùa yêu', 'ngải yêu', 'ngải tình', 'bùa mê', 'love charm', 'love spell', 'love magic', '情蛊', '情降', '和合术', '爱情符'],
  },
  bua_ho_menh: {
    label: 'Bùa hộ mệnh', tag: 'BuaHoMenh',
    keywords: ['bùa hộ mệnh', 'hộ thân', 'bùa bình an', 'amulet', 'protective charm', '护身符', '平安符', '护符', '護身符'],
  },
  co_trung: {
    label: 'Cổ trùng / Cổ độc', tag: 'CoTrung',
    keywords: ['cổ trùng', 'cổ độc', 'nuôi cổ', 'gu poison', 'gu magic', 'gu (poison)', 'ku poison', '蛊', '蠱'],
  },
  ngai: {
    label: 'Ngải', tag: 'Ngai',
    keywords: ['bùa ngải', 'nuôi ngải', 'cây ngải', 'thầy ngải', 'luyện ngải', 'ngải khmer', 'ngải thái'],
  },
  phu_chu: {
    label: 'Phù chú / Phù lục', tag: 'PhuChu',
    keywords: ['phù chú', 'phù lục', 'bùa chú', 'thần chú', 'lỗ ban', 'lổ ban', 'talisman', 'fulu', '符咒', '符箓', '符籙', '咒语', '鲁班', '魯班', '茅山术'],
  },
  thu_em: {
    label: 'Thư ếm / Tà thuật', tag: 'ThuEm',
    keywords: ['thư ếm', 'trù ếm', 'yểm bùa', 'bùa hại', 'tà thuật', 'curse', 'hex', 'black magic', 'sorcery', '巫蛊', '厌胜', '厭勝', '魇镇', '降头', '降頭', '邪术'],
  },
  nghi_le_shaman: {
    label: 'Nghi lễ / Shaman', tag: 'Shaman',
    keywords: ['thầy mo', 'thầy cúng', 'thầy tào', 'hát then', 'tín ngưỡng then', 'shaman', 'saman', 'lên đồng', 'hầu đồng', '萨满', '巫师', '巫觋', 'spirit medium'],
  },
  khac: { label: 'Khác', tag: 'Khac', keywords: [] },
};

// Từ gây nhiễu: "ngải cứu" là rau/thuốc, không phải bùa ngải.
export const NOISE = ['ngải cứu', 'mugwort', 'artemisia'];

/**
 * Giải thích mặc định theo loại, dùng khi không có OpenAI.
 * Mô tả niềm tin dân gian; phần phòng tránh ưu tiên lời khuyên thực tế (lừa đảo, y tế, pháp luật).
 */
export const EXPLANATIONS = {
  bua_yeu: {
    chuc_nang: 'Theo tín ngưỡng dân gian, bùa yêu (ngải yêu, 情蛊, 情降) được cho là khiến người bị yểm nảy sinh tình cảm, nhớ nhung hoặc lệ thuộc vào người làm bùa.',
    phong_tranh: [
      'Cảnh giác với "thầy bùa" quảng cáo trên mạng xã hội: phần lớn là lừa đảo chiếm đoạt tiền.',
      'Không đưa ảnh, tóc, móng tay, quần áo hay ngày giờ sinh cho người lạ.',
      'Không ăn uống đồ do người lạ hoặc người có ý đồ đưa cho.',
      'Người thân thay đổi cảm xúc, hành vi đột ngột cần được quan tâm và đưa đi gặp chuyên gia tâm lý hoặc bác sĩ.',
      'Theo dân gian, người ta tìm đến chùa, nhà thờ hoặc thầy cúng uy tín để "giải"; tránh những nơi đòi tiền lớn.',
    ],
  },
  bua_ho_menh: {
    chuc_nang: 'Bùa hộ mệnh (护身符, 平安符) được mang theo người hoặc treo trong nhà với niềm tin giúp xua đuổi tà khí, tránh tai nạn, cầu bình an.',
    phong_tranh: [
      'Bùa hộ mệnh mang ý nghĩa tinh thần, không thay thế các biện pháp an toàn thực tế.',
      'Cẩn thận khi "thỉnh" bùa với giá rất cao từ nguồn không rõ ràng.',
      'Không tin lời hù doạ "không mua bùa sẽ gặp hoạ" — đây là chiêu thức lừa đảo phổ biến.',
    ],
  },
  co_trung: {
    chuc_nang: 'Theo truyền thuyết vùng Tây Nam Trung Quốc (Miêu Cương) và miền núi phía Bắc Việt Nam, cổ (蛊) là độc trùng được "nuôi" để hại người, thường qua đồ ăn thức uống.',
    phong_tranh: [
      'Ăn chín uống sôi, cẩn thận với đồ ăn lạ khi đến vùng sâu vùng xa.',
      'Triệu chứng hay bị gán cho "trúng cổ" (đau bụng, sụt cân, mệt mỏi kéo dài) thường do ngộ độc, ký sinh trùng hoặc bệnh lý: cần đi khám bác sĩ.',
      'Theo dân gian, người ta nhờ thầy cúng làm lễ giải; việc này không thay thế việc chữa bệnh.',
      'Không vội quy kết người khác "nuôi cổ": định kiến này từng gây kỳ thị, bạo lực với các cộng đồng thiểu số.',
    ],
  },
  ngai: {
    chuc_nang: 'Ngải là các loại cây (thường họ gừng, nghệ) được thầy ngải "luyện" bằng nghi lễ, được tin là dùng vào tình duyên, buôn bán hoặc hại người. Phổ biến trong truyền thuyết vùng Bảy Núi (An Giang), Khmer và Thái.',
    phong_tranh: [
      'Cảnh giác với dịch vụ "nuôi ngải, thỉnh ngải" bán qua mạng: thường là lừa đảo.',
      'Không ăn, uống hay đắp các loại cây, củ lạ không rõ nguồn gốc: nhiều loại có độc.',
      'Theo dân gian, người ta tin ngải sợ một số vật phẩm tôn giáo và tìm đến chùa để giải.',
    ],
  },
  phu_chu: {
    chuc_nang: 'Phù chú / phù lục (符咒, 符箓) là lá bùa viết chữ và ký hiệu (thường bằng chu sa trên giấy vàng) kèm câu chú, dùng trong Đạo giáo và tín ngưỡng dân gian để trấn trạch, trừ tà, chữa bệnh, cầu an. Bùa Lỗ Ban (鲁班书) gắn với nghề mộc, được tin là dùng để yểm nhà.',
    phong_tranh: [
      'Phù chú là di sản tín ngưỡng: nên tìm hiểu với tinh thần nghiên cứu, tôn trọng.',
      'Không tự ý đốt, uống "nước bùa": tro giấy, mực chu sa (thuỷ ngân sunfua) có thể gây hại cho sức khoẻ.',
      'Cẩn thận với người tự xưng thầy pháp đòi tiền "trấn yểm" nhà cửa.',
    ],
  },
  thu_em: {
    chuc_nang: 'Thư ếm, yểm (厌胜, 巫蛊, 降头) là việc dùng bùa, hình nhân hay vật yểm chôn giấu để gây hại cho người khác, theo tín ngưỡng dân gian.',
    phong_tranh: [
      'Bất ổn sức khoẻ, công việc nên tìm nguyên nhân thực tế (y tế, tài chính, tâm lý) trước.',
      'Cảnh giác với dịch vụ "giải ếm, giải hạn" đòi tiền cao.',
      'Nghi ngờ "bị ếm" dễ dẫn tới xung đột, bạo lực: hãy bình tĩnh và giải quyết mâu thuẫn bằng pháp luật.',
      'Theo dân gian, người ta nhờ nhà chùa hoặc thầy cúng uy tín làm lễ; hãy chọn nơi minh bạch.',
    ],
  },
  nghi_le_shaman: {
    chuc_nang: 'Thầy mo (Mường), then (Tày, Nùng), thầy cúng (H\'Mông, Dao), shaman là người làm trung gian giữa con người và thế giới thần linh trong các nghi lễ chữa bệnh, cầu mùa, tang ma.',
    phong_tranh: [
      'Tôn trọng nghi lễ và tri thức bản địa của cộng đồng.',
      'Không bỏ điều trị ở cơ sở y tế để chỉ dựa vào cúng bái.',
      'Cẩn thận với người mạo danh thầy cúng để lừa tiền.',
    ],
  },
  khac: {
    chuc_nang: 'Tư liệu liên quan đến tín ngưỡng bùa chú dân gian.',
    phong_tranh: [
      'Tiếp cận với tinh thần nghiên cứu văn hoá, tôn trọng tín ngưỡng của cộng đồng.',
      'Cảnh giác với các dịch vụ bùa ngải đòi tiền: phần lớn là lừa đảo.',
    ],
  },
};
