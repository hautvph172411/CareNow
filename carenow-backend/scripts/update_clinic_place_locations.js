const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'CareNow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '070402',
});

// Danh sách tỉnh/thành phố và ID tương ứng trong tbl_location_province
const PROVINCES = [
  { id: 1, names: ['hà nội', 'ha noi', 'hải bối'] }, // hải bối is in Đông Anh, Hà Nội
  { id: 5, names: ['hồ chí minh', 'ho chi minh', 'tp hcm', 'tp.hcm', 'tp. hcm', 'q. gò vấp', 'q. gò vấp', 'hóc môn', 'phú nhuận', 'bình tân'] },
  { id: 4, names: ['đà nẵng', 'da nang'] },
  { id: 6, names: ['cần thơ', 'can tho'] },
  { id: 3, names: ['hải phòng', 'hai phong'] },
  { id: 27, names: ['quảng ninh', 'quang ninh', 'hạ long', 'ha long'] },
  { id: 21, names: ['lào cai', 'lao cai'] },
  { id: 33, names: ['tuyên quang', 'tuyen quang'] },
  { id: 11, names: ['đắk lắk', 'dak lak', 'đắc lắc', 'dắc lắc', 'buôn ma thuột'] },
  { id: 7, names: ['an giang', 'long xuyên'] },
  { id: 8, names: ['bắc ninh', 'bac ninh'] },
  { id: 9, names: ['cao bằng', 'cao bang'] },
  { id: 10, names: ['cà mau', 'ca mau'] },
  { id: 2, names: ['huế', 'thừa thiên huế', 'hue'] },
  { id: 13, names: ['đồng nai', 'bien hoa', 'biên hòa'] },
  { id: 14, names: ['đồng tháp', 'dong thap'] },
  { id: 15, names: ['gia lai'] },
  { id: 16, names: ['hà tĩnh', 'ha tinh'] },
  { id: 17, names: ['hưng yên', 'hung yen'] },
  { id: 18, names: ['khánh hòa', 'khanh hoa', 'nha trang'] },
  { id: 19, names: ['lai châu', 'lai chau'] },
  { id: 20, names: ['lạng sơn', 'lang son'] },
  { id: 22, names: ['lâm đồng', 'lam dong', 'đà lạt', 'da lat'] },
  { id: 23, names: ['nghệ an', 'nghe an', 'vinh'] },
  { id: 24, names: ['ninh bình', 'ninh binh'] },
  { id: 25, names: ['phú thọ', 'phu tho'] },
  { id: 26, names: ['quảng ngãi', 'quang ngai'] },
  { id: 28, names: ['quảng trị', 'quang tri'] },
  { id: 29, names: ['sơn la', 'son la'] },
  { id: 30, names: ['tây ninh', 'tay ninh'] },
  { id: 31, names: ['thái nguyên', 'thai nguyen'] },
  { id: 32, names: ['thanh hóa', 'thanh hoa'] },
  { id: 34, names: ['vĩnh long', 'vinh long'] },
  { id: 12, names: ['điện biên', 'dien bien'] }
];

// Bản đồ quận/huyện theo province_id, bổ sung tên phường/xã/phố để tự động nhận diện quận huyện
const DISTRICTS_MAP = {
  // Hà Nội
  1: [
    { id: 1, names: ['ba đình', 'ba dinh', 'nghĩa dũng', 'phúc xá', 'ngọc khánh', 'đê la thành', 'giảng võ', 'trần huy liệu'] },
    { id: 2, names: ['hoàn kiếm', 'hoan kiem', 'bạch đằng', 'chương dương', 'trần bình trọng'] },
    { id: 3, names: ['tây hồ', 'tay ho', 'thụy khuê', 'xuân la'] },
    { id: 4, names: ['long biên', 'long bien', 'ngô gia tự', 'đức giang'] },
    { id: 5, names: ['cầu giấy', 'cau giay', 'trần duy hưng', 'nguyễn văn huyên', 'nghĩa đô', 'dịch vọng hậu', 'duy tân', 'trung kính', 'trung hòa', 'yên hòa'] },
    { id: 6, names: ['đống đa', 'dong da', 'xã đàn', 'phương mai', 'thái thịnh', 'thịnh quang'] },
    { id: 7, names: ['hai bà trưng', 'hai ba trung', 'đại cồ việt', 'giải phóng', 'nguyễn bỉnh khiêm', 'đồng tâm', 'lê thanh nghị'] },
    { id: 8, names: ['hoàng mai', 'hoang mai', 'đại từ', 'định công', 'tương mai', 'gamuda', 'trần phú', 'đại kim', 'kim văn kim lũ'] },
    { id: 9, names: ['thanh xuân', 'thanh xuan', 'nguyễn trãi'] }, // Removed "trường chinh" to avoid conflict with Tương Mai (Hoàng Mai) for An Việt
    { id: 16, names: ['sóc sơn', 'soc son', 'phù linh'] },
    { id: 17, names: ['đông anh', 'dong anh', 'hải bối', 'kim chung', 'uy nỗ', 'cao lỗ', 'thiết úng'] },
    { id: 18, names: ['gia lâm', 'gia lam', 'đình xuyên', 'trâu quỳ', 'đa tốn', 'phú thị', 'ngô xuân quảng'] },
    { id: 19, names: ['nam từ liêm', 'nam tu liem', 'mỹ định', 'mỹ đình', 'mễ trì', 'sa đôi', 'nguyễn hoàng'] },
    { id: 20, names: ['thanh trì', 'thanh tri', 'tứ hiệp', 'tân triều'] },
    { id: 21, names: ['bắc từ liêm', 'bac tu liem', 'phạm văn đồng', 'cổ nhuế'] },
    { id: 250, names: ['mê linh', 'me linh', 'đại thịnh'] },
    { id: 268, names: ['hà đông', 'ha dong', 'phúc la', 'phùng hưng'] },
    { id: 269, names: ['sơn tay', 'sơn tây', 'trung sơn trầm'] },
    { id: 271, names: ['ba vì', 'ba vi', 'tây đằng', 'quảng oai'] },
    { id: 272, names: ['phúc thọ', 'phuc tho'] },
    { id: 273, names: ['đan phượng', 'dan phuong', 'tân lập'] },
    { id: 274, names: ['hoài đức', 'hoai duc', 'an khánh'] },
    { id: 275, names: ['quốc oai', 'quoc oai'] },
    { id: 276, names: ['thạch thất', 'thach that', 'kim quan'] },
    { id: 277, names: ['chương mỹ', 'chuong my', 'chúc sơn', 'bắc sơn'] },
    { id: 278, names: ['thanh oai', 'kim bài'] },
    { id: 279, names: ['thường tín', 'thuong tin', 'trần lư'] },
    { id: 280, names: ['phú xuyên', 'phu xuyen', 'phúc tiến', 'thôn ứng hòa'] },
    { id: 281, names: ['ứng hòa', 'ung hoa', 'vân đình', 'thanh ấm'] },
    { id: 282, names: ['mỹ đức', 'my duc', 'đại nghĩa', 'đại đồng'] }
  ],
  // TP HCM
  5: [
    { id: 760, names: ['quận 1', 'q.1', 'q1', 'quận một'] },
    { id: 761, names: ['quận 12', 'q.12', 'q12'] },
    { id: 762, names: ['thủ đức', 'thu duc'] },
    { id: 763, names: ['quận 9', 'q.9', 'q9'] },
    { id: 764, names: ['gò vấp', 'go vap', 'q. gò vấp'] },
    { id: 765, names: ['bình thạnh', 'binh thanh'] },
    { id: 766, names: ['tân bình', 'tan binh'] },
    { id: 767, names: ['tân phú', 'tan phu'] },
    { id: 768, names: ['phú nhuận', 'phu nhuan'] },
    { id: 769, names: ['quận 2', 'q.2', 'q2'] },
    { id: 770, names: ['quận 3', 'q.3', 'q3'] },
    { id: 771, names: ['quận 10', 'q.10', 'q10', 'sư vạn hạnh'] },
    { id: 772, names: ['quận 11', 'q.11', 'q11'] },
    { id: 773, names: ['quận 4', 'q.4', 'q4'] },
    { id: 774, names: ['quận 5', 'q.5', 'q5', 'nguyễn chí thanh'] },
    { id: 775, names: ['quận 6', 'q.6', 'q6'] },
    { id: 776, names: ['quận 8', 'q.8', 'q8'] },
    { id: 777, names: ['bình tân', 'binh tan'] },
    { id: 778, names: ['quận 7', 'q.7', 'q7'] },
    { id: 783, names: ['củ chi', 'cu chi'] },
    { id: 784, names: ['hóc môn', 'hoc mon', 'đặng thúc vịnh'] },
    { id: 785, names: ['bình chánh', 'binh chanh'] },
    { id: 786, names: ['nhà bè', 'nha be'] },
    { id: 787, names: ['cần giờ', 'can gio'] }
  ],
  // Hải Phòng
  3: [
    { id: 303, names: ['hồng bàng', 'hong bang'] },
    { id: 304, names: ['ngô quyền', 'ngo quyen'] },
    { id: 305, names: ['lê chân', 'le chan'] },
    { id: 306, names: ['hải an', 'hai an'] },
    { id: 307, names: ['kiến an', 'kien an', 'lãm hà'] },
    { id: 308, names: ['đồ sơn', 'do son'] },
    { id: 309, names: ['dương kinh', 'duong kinh'] },
    { id: 311, names: ['thủy nguyên', 'thuy nguyen'] },
    { id: 312, names: ['an dương', 'an duong'] },
    { id: 313, names: ['an lão', 'an lao'] },
    { id: 314, names: ['kiến thụy', 'kien thuy'] },
    { id: 315, names: ['tiên lãng', 'tien lang'] },
    { id: 316, names: ['vĩnh bảo', 'vinh bao'] },
    { id: 317, names: ['cát hải', 'cat hai'] }
  ],
  // Đà Nẵng
  4: [
    { id: 490, names: ['liên chiểu', 'lien chieu'] },
    { id: 491, names: ['thanh khê', 'thanh khe'] },
    { id: 492, names: ['hải châu', 'hai chau'] },
    { id: 493, names: ['sơn trà', 'son tra'] },
    { id: 494, names: ['ngũ hành sơn', 'ngu hanh son'] },
    { id: 495, names: ['cẩm lệ', 'cam le', 'hòa xuân'] },
    { id: 497, names: ['hòa vang', 'hoa vang'] }
  ],
  // Cần Thơ
  6: [
    { id: 916, names: ['ninh kiều', 'ninh kieu', 'hưng lợi'] },
    { id: 917, names: ['bình thủy', 'binh thuy'] },
    { id: 918, names: ['cái răng', 'cai rang'] },
    { id: 919, names: ['ô môn', 'o mon'] },
    { id: 923, names: ['thốt nốt', 'thot not'] }
  ],
  // Quảng Ninh
  27: [
    { id: 530, names: ['hạ long', 'ha long', 'bãi cháy', 'hòn gai'] },
    { id: 532, names: ['móng cái', 'mong cai'] },
    { id: 533, names: ['cẩm phả', 'cam pha'] },
    { id: 534, names: ['uông bí', 'uong bi'] },
    { id: 540, names: ['quảng yên', 'quang yen'] },
    { id: 542, names: ['đông triều', 'dong trieu'] },
    { id: 543, names: ['vân đồn', 'van don'] }
  ],
  // Lào Cai
  21: [
    { id: 80, names: ['lào cai', 'lao cai', 'pom hán', 'pom han'] },
    { id: 84, names: ['sa pa', 'sapa'] },
    { id: 85, names: ['bảo thắng', 'bao thang'] }
  ],
  // Tuyên Quang
  33: [
    { id: 70, names: ['tuyên quang', 'tuyen quang', 'phan thiết'] }
  ],
  // Đắk Lắk
  11: [
    { id: 643, names: ['buôn ma thuột', 'buon ma thuot', 'ea tam'] }
  ],
  // An Giang
  7: [
    { id: 883, names: ['long xuyên', 'long xuyen', 'mỹ phước'] }
  ]
};

async function updateClinicPlaceLocations() {
  try {
    console.log('=== BẮT ĐẦU TRÍCH XUẤT TỈNH THÀNH QUẬN HUYỆN TỪ ĐỊA CHỈ ===');
    
    // Lấy toàn bộ các clinic places
    const res = await pool.query('SELECT id, name, address, province_id, district_id FROM tbl_clinic_place');
    const places = res.rows;
    console.log(`Tìm thấy ${places.length} cơ sở y tế trong database.`);

    let updatedCount = 0;
    
    for (const place of places) {
      const address = place.address ? place.address.trim() : '';
      if (!address) {
        continue;
      }

      const normalizedAddress = address.toLowerCase();

      // 1. Trích xuất Tỉnh/Thành
      let matchedProvinces = [];
      for (const province of PROVINCES) {
        for (const name of province.names) {
          if (normalizedAddress.includes(name)) {
            matchedProvinces.push(province.id);
            break; // Tránh trùng lặp ID của cùng một tỉnh
          }
        }
      }

      // Loại bỏ trùng lặp nếu có
      matchedProvinces = [...new Set(matchedProvinces)];

      // Nếu địa chỉ chứa nhiều hơn 1 tỉnh (ví dụ như các cơ sở chuỗi cha có nhiều địa chỉ), ta sẽ bỏ qua
      // để tránh gán sai tỉnh thành
      let targetProvinceId = place.province_id;
      let targetDistrictId = place.district_id;

      if (matchedProvinces.length === 1) {
        targetProvinceId = matchedProvinces[0];
      } else if (matchedProvinces.length > 1) {
        // Có nhiều hơn 1 tỉnh khớp (chuỗi cơ sở liên tỉnh), gán null
        targetProvinceId = null;
        targetDistrictId = null;
      }

      // 2. Trích xuất Quận/Huyện dựa trên Tỉnh/Thành đã xác định
      if (targetProvinceId && DISTRICTS_MAP[targetProvinceId]) {
        let matchedDistricts = [];
        const districts = DISTRICTS_MAP[targetProvinceId];
        for (const district of districts) {
          for (const name of district.names) {
            if (normalizedAddress.includes(name)) {
              matchedDistricts.push(district.id);
              break;
            }
          }
        }

        matchedDistricts = [...new Set(matchedDistricts)];

        if (matchedDistricts.length === 1) {
          targetDistrictId = matchedDistricts[0];
        } else if (matchedDistricts.length > 1) {
          // Nhiều quận được nhắc tới hoặc không rõ ràng, giữ nguyên hoặc null
          targetDistrictId = null;
        } else {
          // Không tìm thấy quận/huyện nào khớp
          targetDistrictId = null;
        }
      } else {
        // Không có province khớp hoặc province không có map quận huyện
        targetDistrictId = null;
      }

      // Chỉ cập nhật nếu có sự thay đổi
      if (targetProvinceId !== place.province_id || targetDistrictId !== place.district_id) {
        await pool.query(
          'UPDATE tbl_clinic_place SET province_id = $1, district_id = $2 WHERE id = $3',
          [targetProvinceId, targetDistrictId, place.id]
        );
        updatedCount++;
        console.log(`[CẬP NHẬT] ID: ${place.id} | ${place.name}`);
        console.log(`   Địa chỉ: ${address}`);
        console.log(`   -> Province: ${place.province_id} => ${targetProvinceId} | District: ${place.district_id} => ${targetDistrictId}`);
      }
    }

    console.log('\n=== HOÀN THÀNH CÔNG VIỆC ===');
    console.log(`Đã cập nhật tỉnh thành/quận huyện cho ${updatedCount} cơ sở y tế.`);

  } catch (error) {
    console.error('Lỗi nghiêm trọng:', error.message);
  } finally {
    pool.end();
  }
}

updateClinicPlaceLocations();
