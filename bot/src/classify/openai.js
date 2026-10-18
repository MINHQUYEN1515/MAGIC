import OpenAI from 'openai';
import { REGIONS, TYPES } from './categories.js';

// Chỉ gửi phần đầu văn bản: đủ để phân loại, tránh tốn token với tài liệu dài.
const MAX_CHARS = 12_000;

export const SCHEMA = {
  type: 'object',
  properties: {
    relevant: {
      type: 'boolean',
      description: 'true nếu tài liệu/ảnh thực sự liên quan đến bùa ngải, phù chú, cổ thuật, tà thuật hoặc tín ngưỡng/pháp sư dân gian',
    },
    region: { type: 'string', enum: Object.keys(REGIONS) },
    type: { type: 'string', enum: Object.keys(TYPES) },
    ethnic_groups: { type: 'array', items: { type: 'string' } },
    ten_bua: { type: 'string', description: 'Tên gọi cụ thể của loại bùa/nghi lễ trong tài liệu (tiếng Việt, kèm tên gốc nếu có)' },
    summary_vi: { type: 'string', description: 'Tóm tắt 2-3 câu bằng tiếng Việt' },
    nguon_goc: { type: 'string', description: 'Nguồn gốc, bối cảnh văn hoá, 2-4 câu' },
    chuc_nang: { type: 'string', description: 'Chức năng theo tín ngưỡng dân gian, 2-4 câu' },
    hinh_anh: {
      type: 'array',
      items: { type: 'string' },
      description: 'Mỗi phần tử mô tả một ảnh theo đúng thứ tự: ảnh thể hiện gì, ký hiệu/chữ trên đó và chức năng của nó',
    },
    cach_phong_tranh: { type: 'array', items: { type: 'string' }, description: '3-5 lời khuyên' },
  },
  required: ['relevant', 'region', 'type', 'ethnic_groups', 'ten_bua', 'summary_vi', 'nguon_goc', 'chuc_nang', 'hinh_anh', 'cach_phong_tranh'],
  additionalProperties: false, // bắt buộc với strict structured outputs
};

export const SYSTEM = `Bạn là nhà nghiên cứu văn hoá dân gian, phân loại và giải thích tư liệu về bùa ngải ở Trung Quốc, Việt Nam và các dân tộc thiểu số. Viết bằng tiếng Việt.

Khu vực (region):
${Object.entries(REGIONS).map(([id, r]) => `- ${id}: ${r.label}`).join('\n')}
Nếu tài liệu chủ yếu nói về một dân tộc thiểu số (H'Mông/Miêu, Thái, Mường, Khmer, Chăm, Tày, Nùng, Dao, Choang, Di, các dân tộc Tây Nguyên...) thì chọn dan_toc_thieu_so, dù ở Việt Nam hay Trung Quốc.

Loại (type):
${Object.entries(TYPES).map(([id, t]) => `- ${id}: ${t.label}`).join('\n')}

ethnic_groups: chỉ ghi các dân tộc thiểu số được nói tới (tiếng Việt), KHÔNG ghi dân tộc đa số như Kinh, Hán, Hoa; rỗng nếu không có.

Yêu cầu nội dung:
- Mô tả như một tư liệu văn hoá: nói rõ đây là niềm tin dân gian ("theo dân gian", "được cho là"), không khẳng định là có thật.
- KHÔNG hướng dẫn cách làm, vẽ, luyện hay sử dụng bùa.
- hinh_anh: mô tả lần lượt từng ảnh được gửi kèm (đúng số lượng, đúng thứ tự). Nếu ảnh có chữ Hán hãy phiên âm/dịch nghĩa ngắn.
- cach_phong_tranh: kết hợp quan niệm dân gian (ghi rõ là quan niệm) và lời khuyên thực tế: cảnh giác lừa đảo "thầy bùa", đi khám bác sĩ khi có triệu chứng, giải quyết mâu thuẫn bằng pháp luật, tôn trọng văn hoá cộng đồng.
- relevant=false nếu tư liệu chỉ trùng từ khoá (ví dụ "ngải cứu" là rau, tên phim, bài hát, truyện, tên người).`;

export function createOpenAIClassifier({ apiKey, model }) {
  // Tự thử lại (có log) ở classify/index.js, nên tắt retry của SDK để không thử lại hai lần.
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 120_000 });

  /** @param images [{ data: Buffer, mimeType }] */
  return async function classifyWithOpenAI({ title, source, url, text }, images = []) {
    const body = (text ?? '').slice(0, MAX_CHARS);
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Tiêu đề: ${title}\nNguồn: ${source} (${url})\nSố ảnh gửi kèm: ${images.length}\n\n${body}` },
            // detail "low": đủ để nhận diện lá bùa/vật phẩm, tốn ít token hơn nhiều.
            ...images.map((img) => ({
              type: 'image_url',
              image_url: { url: `data:${img.mimeType};base64,${img.data.toString('base64')}`, detail: 'low' },
            })),
          ],
        },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'phan_loai_bua', strict: true, schema: SCHEMA } },
    });

    const choice = res.choices[0];
    if (choice?.message?.refusal) throw new Error(`OpenAI từ chối: ${choice.message.refusal}`);
    if (choice?.finish_reason === 'length') throw new Error('OpenAI trả lời bị cắt (hết max tokens)');
    if (choice?.finish_reason === 'content_filter') throw new Error('OpenAI chặn nội dung (content_filter)');

    const out = JSON.parse(choice?.message?.content ?? '');
    if (!(out.region in REGIONS) || !(out.type in TYPES)) throw new Error('OpenAI trả về nhãn không hợp lệ');
    return { ...out, method: 'openai' };
  };
}
