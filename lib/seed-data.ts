import type { Post } from "@/lib/types";

const imageSets = [
  ["/images/coral.jpg", "/images/deck.jpg", "/images/reef.jpg"],
  ["/images/plastic.jpg", "/images/ocean.jpg"],
  ["/images/storm.jpg", "/images/waves.jpg", "/images/sailboat.jpg"],
  ["/images/ice.jpg", "/images/coast.jpg"],
  ["/images/harbor.jpg"],
  ["/images/reef.jpg", "/images/coral.jpg"],
];

const stories = [
  {
    author: "WindSailor",
    title: "南中国海的异常暖流",
    body: "这次航行中，明显感觉到海水温度比往常更高。珊瑚礁区出现了大片白化现象，当地渔民也说，近年这样的情况越来越频繁。我们必须重视海洋正在发生的变化。",
    textAnalysis: "你记录的‘海水温度升高’和‘珊瑚白化’是一组非常关键的海洋信号。持续高温会让珊瑚排出体内共生藻，失去颜色与主要能量来源。一次观察不能代表长期趋势，但水手连续、跨海域的记录，恰好能补充岸基监测看不到的细节。",
    imageAnalysis: "照片中的浅色珊瑚与周围仍有颜色的群落形成对比，具有白化现象的视觉特征。海水异常升温是大规模珊瑚白化的主要诱因，而沿岸污染与过度开发会进一步削弱珊瑚恢复能力。",
  },
  {
    author: "Blue Horizon",
    title: "大西洋上的塑料垃圾带",
    body: "航行至北大西洋时，看到大量塑料垃圾随海浪漂浮，触目惊心。它们从哪里来，又最终会去向哪里？",
    textAnalysis: "漂浮塑料会被洋流汇聚，并逐渐破碎为更难清理的微塑料。它们可能来自沿岸生活垃圾、渔业装备和船运活动。你留下的位置和时间信息，对理解污染物流向很有价值。",
    imageAnalysis: "画面可见多种漂浮塑料，其中部分已出现破碎和附着物。这类垃圾可能被鱼、海鸟和海龟误食，也会携带外来生物跨海域传播。",
  },
  {
    author: "SailingDream",
    title: "突如其来的风暴",
    body: "原本晴朗的天空在几小时内变得乌云密布，风暴来得太快，浪高超过四米。自然的力量让人敬畏，也提醒我们更加谨慎地理解海洋。",
    textAnalysis: "单次强风暴不能直接归因于气候变化，但更暖的海水和大气能够为部分极端天气提供更多能量与水汽。把风速、气压、浪高和位置一起记录下来，会让这段经历具有更高的观察价值。",
  },
  {
    author: "OceanChild",
    title: "冰川在消融",
    body: "航行至格陵兰附近，看到巨大的冰川崩解入海。当地向导说，熟悉的冰壁每年都在向后退。亲眼看到这种变化，感受完全不同。",
    textAnalysis: "冰川消融既受季节变化影响，也与长期升温有关。陆地冰川加速流入海洋会推高全球平均海平面；而冰面缩小又会降低阳光反射率，形成进一步吸热的反馈。",
  },
  {
    author: "SeaRunner",
    title: "港湾里消失的海草床",
    body: "去年还清晰可见的海草床，如今只剩稀疏几片。港口扩建后水体更浑浊了，小鱼群也少了许多。",
    textAnalysis: "海草床需要阳光穿透水体完成光合作用。疏浚、岸线施工和富营养化都会增加浑浊度，遮蔽光线。海草床既是幼鱼的栖息地，也能固定沉积物和储存碳，它的变化值得持续追踪。",
  },
  {
    author: "TideNotes",
    title: "赤潮之后的清晨",
    body: "靠岸前发现海面呈暗红色，第二天岸边出现了死鱼。当地人说这几年夏季更常见，不知道是不是海水变暖造成的。",
    textAnalysis: "赤潮通常与藻类快速繁殖有关，营养盐输入、水体交换不足和适宜温度都可能参与其中。海水变暖可能改变发生季节和持续时间，但需要结合水质与藻种检测才能判断具体原因。",
  },
  {
    author: "NorthStar",
    title: "雾中的鲸歌",
    body: "在安静的清晨听见鲸的呼吸声，却也不断听到远处货轮的低沉噪音。海洋从来不是安静的，但人造声音似乎越来越密集。",
    textAnalysis: "船舶噪声会覆盖鲸类用于交流、导航和觅食的声音频段。降低航速、优化航线和改进螺旋桨设计，都能减少水下噪声。这是一种不容易被看见、却真实存在的人类影响。",
  },
  {
    author: "CoralWatcher",
    title: "一场雨后的浑浊海岸",
    body: "暴雨过后，河口冲出大片褐色水体，一直延伸到珊瑚礁上方。海面还漂着生活垃圾和枯枝。",
    textAnalysis: "暴雨径流会把泥沙、营养盐和城市污染物带入近海。浑浊水体降低光照，沉积物也可能覆盖珊瑚。保护河流缓冲带和改善城市雨洪管理，能够从源头减轻这种压力。",
  },
  {
    author: "MoonTide",
    title: "比航海图更高的潮水",
    body: "满潮时码头边缘几乎与海面齐平，旧航海日志里同样潮位并没有这么高。老船长说近几年淹水次数明显增加。",
    textAnalysis: "单次潮位由天文潮、气压、风和波浪共同决定。若长期基准海平面抬升，同样的风暴或大潮会更容易越过码头。历史日志与现代潮位站数据互相印证，会非常有说服力。",
  },
  {
    author: "HarborLight",
    title: "夜航时看见的油膜",
    body: "港外的月光下，海面有一层彩色油膜。味道不重，却一直延伸了很远，希望有人能追查它的来源。",
    textAnalysis: "薄油膜可能来自燃油泄漏、船舶排放或城市径流。即便没有大规模事故，长期的小量输入也会伤害鱼卵、浮游生物与海鸟。记录坐标、面积、颜色和气味，并向当地海事部门报告最有帮助。",
  },
];

const comments = [
  "感谢分享，这些来自海上的第一手记录很珍贵。",
  "我去年经过附近海域时也观察到类似变化。",
  "希望以后能看到同一地点的持续记录。",
];

export const seedPosts: Post[] = Array.from({ length: 30 }, (_, index) => {
  const story = stories[index % stories.length];
  const round = Math.floor(index / stories.length);
  const id = `story-${String(index + 1).padStart(2, "0")}`;
  const createdAt = new Date(Date.now() - index * 5.4e6).toISOString();

  return {
    id,
    author: round === 0 ? story.author : `${story.author}${round + 1}`,
    title: round === 0 ? story.title : `${story.title} · 续记 ${round + 1}`,
    body: story.body,
    images: imageSets[index % imageSets.length],
    likes: 36 + ((index * 17) % 153),
    createdAt,
    textAnalysis: story.textAnalysis,
    aiAnalysis: [story.textAnalysis, story.imageAnalysis].filter(Boolean).join(" "),
    imageAnalysis: story.imageAnalysis,
    comments: Array.from({ length: 1 + (index % 3) }, (_, commentIndex) => ({
      id: `${id}-comment-${commentIndex + 1}`,
      postId: id,
      author: ["SeaGlass", "远岸", "白帆"][commentIndex],
      body: comments[commentIndex],
      createdAt: new Date(new Date(createdAt).getTime() + (commentIndex + 1) * 7.2e5).toISOString(),
    })),
  };
});
