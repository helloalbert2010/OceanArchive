with source(author, title, body, text_analysis, image_analysis, images) as (
  values
  ('WindSailor','南中国海的异常暖流','这次航行中，明显感觉到海水温度比往常更高。珊瑚礁区也出现了大片白化现象。','海水持续异常偏暖会给珊瑚生态系统带来压力，而沿岸污染等人类活动又可能削弱它的恢复能力。水手的连续记录能补充宝贵的现场细节。','画面中的珊瑚颜色差异值得关注，但仅凭照片不能确认白化程度。结合水温、位置和重复拍摄会更有价值。',array['/images/coral.jpg','/images/reef.jpg']),
  ('Blue Horizon','大西洋上的塑料垃圾带','航行至北大西洋时，看到大量塑料垃圾随海浪漂浮，触目惊心。','漂浮塑料会被洋流汇聚，并逐渐破碎为更难清理的微塑料。时间和坐标信息能帮助追踪污染物流向。','照片保留了海面漂浮物的现场状态，建议结合坐标向当地海事部门报告。',array['/images/plastic.jpg','/images/ocean.jpg']),
  ('SailingDream','突如其来的风暴','原本晴朗的天空在几小时内变得乌云密布，浪高超过四米。','单次强风暴不能直接归因于气候变化，但更暖的海洋和大气能为部分极端天气提供更多能量与水汽。',null,array['/images/storm.jpg','/images/waves.jpg']),
  ('OceanChild','冰川在消融','航行至高纬海域，亲眼看到巨大的冰川崩解入海。','陆地冰川加速流入海洋会推高全球平均海平面，长期、定点的影像记录可以帮助人们直观理解变化。',null,array['/images/ice.jpg','/images/coast.jpg']),
  ('SeaRunner','港湾里消失的海草床','去年还清晰可见的海草床，如今只剩稀疏几片。','疏浚、岸线施工和富营养化都会增加水体浑浊度，影响海草的光合作用，也会改变幼鱼栖息地。',null,array['/images/harbor.jpg']),
  ('TideNotes','赤潮之后的清晨','靠岸前发现海面呈暗红色，第二天岸边出现了死鱼。','赤潮常与营养盐输入、水体交换和适宜温度共同有关，需要结合水质与藻种检测判断原因。',null,array['/images/ocean.jpg']),
  ('NorthStar','雾中的鲸歌','清晨听见鲸的呼吸声，也不断听到远处货轮的低沉噪音。','船舶噪声可能覆盖鲸类用于交流、导航和觅食的声音频段，是一种不易被看见却真实存在的人类影响。',null,array['/images/waves.jpg']),
  ('CoralWatcher','一场雨后的浑浊海岸','暴雨过后，河口冲出大片褐色水体，一直延伸到珊瑚礁上方。','暴雨径流会把泥沙、营养盐和城市污染物带入近海，保护河流缓冲带能从源头减轻压力。',null,array['/images/coast.jpg']),
  ('MoonTide','比航海图更高的潮水','满潮时码头边缘几乎与海面齐平，老船长说近几年淹水次数明显增加。','若长期基准海平面抬升，同样的风暴或大潮会更容易越过码头，历史日志能与现代潮位数据互相印证。',null,array['/images/harbor.jpg']),
  ('HarborLight','夜航时看见的油膜','港外的月光下，海面有一层彩色油膜，一直延伸了很远。','薄油膜可能来自燃油泄漏、船舶排放或城市径流，记录坐标、面积、颜色和气味并报告最有帮助。',null,array['/images/deck.jpg'])
), numbered as (
  select source.*, round_no
  from source cross join generate_series(1, 3) as round_no
)
insert into public.posts (author, title, body, text_analysis, image_analysis, images, likes, created_at)
select
  case when round_no = 1 then author else author || round_no end,
  case when round_no = 1 then title else title || ' · 续记 ' || round_no end,
  body,
  text_analysis,
  image_analysis,
  images,
  28 + ((row_number() over ()) * 17)::integer % 150,
  now() - ((row_number() over ()) * interval '95 minutes')
from numbered;

insert into public.comments (post_id, author, body, created_at)
select id, 'SeaGlass', '感谢分享，这些来自海上的第一手记录很珍贵。', created_at + interval '12 minutes'
from public.posts;
