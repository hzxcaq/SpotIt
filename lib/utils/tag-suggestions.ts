import { db } from "@/lib/db";

export interface TagCategory {
  keywords: string[];
  suggestions: string[];
}

export const tagCategories: Record<string, TagCategory> = {
  "衣物-上装": {
    keywords: ["短袖", "长袖", "T恤", "衬衫", "毛衣", "卫衣", "背心", "吊带"],
    suggestions: ["上衣", "黑色", "白色", "蓝色", "红色", "灰色", "夏季", "冬季"],
  },
  "衣物-下装": {
    keywords: ["裤子", "短裤", "长裤", "牛仔裤", "裙子", "半身裙", "连衣裙"],
    suggestions: ["下装", "黑色", "白色", "蓝色", "休闲", "正装"],
  },
  "衣物-外套": {
    keywords: ["外套", "夹克", "大衣", "羽绒服", "风衣", "棉衣"],
    suggestions: ["外套", "保暖", "防风", "冬季", "秋季", "黑色", "灰色"],
  },
  "衣物-配饰": {
    keywords: ["帽子", "围巾", "手套", "袜子", "腰带", "领带"],
    suggestions: ["配饰", "黑色", "白色", "保暖", "装饰"],
  },
  "衣物-鞋类": {
    keywords: ["鞋", "皮鞋", "运动鞋", "拖鞋", "凉鞋", "靴子", "高跟鞋"],
    suggestions: ["鞋类", "黑色", "白色", "运动", "休闲", "正装"],
  },
  "衣物-内衣": {
    keywords: ["内衣", "内裤", "袜子", "睡衣", "保暖衣"],
    suggestions: ["内衣", "贴身", "舒适", "棉质"],
  },
  "电子-充电": {
    keywords: ["充电器", "充电线", "数据线", "充电宝", "电源适配器"],
    suggestions: ["电子", "充电", "小米", "华为", "苹果", "OPPO", "vivo", "Type-C", "Lightning"],
  },
  "电子-音频": {
    keywords: ["耳机", "音箱", "蓝牙耳机", "有线耳机", "音响"],
    suggestions: ["电子", "音频", "小米", "华为", "苹果", "索尼", "BOSE", "蓝牙", "有线"],
  },
  "电子-电脑": {
    keywords: ["鼠标", "键盘", "U盘", "硬盘", "显示器", "摄像头", "鼠标垫"],
    suggestions: ["电子", "电脑配件", "罗技", "雷蛇", "联想", "戴尔", "有线", "无线"],
  },
  "电子-手机": {
    keywords: ["手机", "手机壳", "手机膜", "支架"],
    suggestions: ["电子", "手机", "小米", "华为", "苹果", "OPPO", "vivo", "三星"],
  },
  "电子-数码": {
    keywords: ["相机", "镜头", "三脚架", "存储卡", "读卡器", "平板"],
    suggestions: ["电子", "数码", "摄影", "存储"],
  },
  "文具-书写": {
    keywords: ["笔", "钢笔", "圆珠笔", "铅笔", "马克笔", "荧光笔", "签字笔"],
    suggestions: ["文具", "书写", "黑色", "蓝色", "红色", "办公", "学习"],
  },
  "文具-纸张": {
    keywords: ["笔记本", "便签", "A4纸", "打印纸", "信封"],
    suggestions: ["文具", "纸张", "办公", "学习", "记录"],
  },
  "文具-工具": {
    keywords: ["剪刀", "胶水", "胶带", "订书机", "计算器", "尺子"],
    suggestions: ["文具", "工具", "办公", "学习"],
  },
  "工具-五金": {
    keywords: ["螺丝刀", "扳手", "钳子", "锤子", "电钻", "螺丝", "钉子"],
    suggestions: ["工具", "五金", "维修", "DIY", "常用"],
  },
  "工具-测量": {
    keywords: ["卷尺", "水平尺", "游标卡尺", "温度计"],
    suggestions: ["工具", "测量", "精密", "常用"],
  },
  "工具-电动": {
    keywords: ["电钻", "电锯", "角磨机", "热风枪", "电烙铁"],
    suggestions: ["工具", "电动", "维修", "DIY"],
  },
  "厨房-餐具": {
    keywords: ["碗", "盘子", "筷子", "勺子", "叉子", "杯子", "水杯"],
    suggestions: ["厨房", "餐具", "陶瓷", "不锈钢", "玻璃", "日常"],
  },
  "厨房-厨具": {
    keywords: ["锅", "炒锅", "平底锅", "砂锅", "刀", "菜刀", "砧板"],
    suggestions: ["厨房", "厨具", "烹饪", "不锈钢", "常用"],
  },
  "厨房-小电器": {
    keywords: ["电饭煲", "微波炉", "烤箱", "豆浆机", "榨汁机", "电磁炉"],
    suggestions: ["厨房", "电器", "小家电", "美的", "苏泊尔", "九阳"],
  },
  "厨房-调料": {
    keywords: ["盐", "糖", "酱油", "醋", "油", "味精", "鸡精", "料酒"],
    suggestions: ["厨房", "调料", "烹饪", "消耗品"],
  },
  "厨房-保鲜": {
    keywords: ["保鲜盒", "保鲜膜", "保鲜袋", "密封罐"],
    suggestions: ["厨房", "保鲜", "收纳", "塑料"],
  },
  "日用-清洁": {
    keywords: ["洗衣液", "洗洁精", "消毒液", "拖把", "扫把", "抹布", "垃圾袋"],
    suggestions: ["日用", "清洁", "卫生", "消耗品", "常用"],
  },
  "日用-洗护": {
    keywords: ["洗发水", "沐浴露", "牙膏", "牙刷", "毛巾", "浴巾", "香皂"],
    suggestions: ["日用", "洗护", "个人护理", "消耗品", "常用"],
  },
  "日用-纸品": {
    keywords: ["纸巾", "卫生纸", "湿巾", "厨房纸"],
    suggestions: ["日用", "纸品", "消耗品", "常用"],
  },
  "日用-护肤": {
    keywords: ["面膜", "洗面奶", "爽肤水", "乳液", "面霜", "防晒霜"],
    suggestions: ["日用", "护肤", "美容", "个人护理"],
  },
  "日用-化妆": {
    keywords: ["口红", "粉底", "眉笔", "睫毛膏", "化妆刷"],
    suggestions: ["日用", "化妆", "美容", "彩妆"],
  },
  "书籍-文学": {
    keywords: ["小说", "散文", "诗歌", "文学"],
    suggestions: ["书籍", "文学", "阅读", "收藏"],
  },
  "书籍-专业": {
    keywords: ["教材", "技术书", "工具书", "词典"],
    suggestions: ["书籍", "专业", "学习", "参考"],
  },
  "书籍-儿童": {
    keywords: ["绘本", "童话", "儿童读物", "漫画"],
    suggestions: ["书籍", "儿童", "启蒙", "教育"],
  },
  "玩具-儿童": {
    keywords: ["玩具", "积木", "拼图", "娃娃", "玩偶"],
    suggestions: ["玩具", "儿童", "益智", "娱乐"],
  },
  "玩具-模型": {
    keywords: ["模型", "手办", "拼装", "遥控车"],
    suggestions: ["玩具", "模型", "收藏", "DIY"],
  },
  "药品-常用": {
    keywords: ["感冒药", "退烧药", "止痛药", "创可贴", "消炎药", "维生素"],
    suggestions: ["药品", "常备", "医疗", "健康"],
  },
  "药品-外用": {
    keywords: ["碘伏", "酒精", "棉签", "纱布", "绷带", "药膏"],
    suggestions: ["药品", "外用", "医疗", "急救"],
  },
  "运动-器材": {
    keywords: ["哑铃", "瑜伽垫", "跳绳", "篮球", "足球", "羽毛球拍"],
    suggestions: ["运动", "健身", "器材", "锻炼"],
  },
  "运动-服饰": {
    keywords: ["运动鞋", "运动服", "运动裤", "运动背心"],
    suggestions: ["运动", "服饰", "健身", "透气", "舒适"],
  },
  "家电-大家电": {
    keywords: ["冰箱", "洗衣机", "空调", "电视", "热水器"],
    suggestions: ["家电", "大家电", "家用"],
  },
  "家电-小家电": {
    keywords: ["吹风机", "电风扇", "加湿器", "空气净化器", "电暖器"],
    suggestions: ["家电", "小家电", "家用", "便携"],
  },
  "家居-床品": {
    keywords: ["床单", "被套", "枕套", "被子", "枕头", "床垫"],
    suggestions: ["家居", "床品", "卧室", "舒适"],
  },
  "家居-收纳": {
    keywords: ["收纳盒", "收纳箱", "衣架", "挂钩", "置物架"],
    suggestions: ["家居", "收纳", "整理", "塑料"],
  },
  "家居-装饰": {
    keywords: ["相框", "挂画", "花瓶", "摆件", "装饰画"],
    suggestions: ["家居", "装饰", "美化", "艺术"],
  },
  "宠物-用品": {
    keywords: ["猫粮", "狗粮", "猫砂", "宠物玩具", "宠物窝"],
    suggestions: ["宠物", "用品", "猫", "狗", "日常"],
  },
  "办公-设备": {
    keywords: ["打印机", "扫描仪", "碎纸机", "装订机"],
    suggestions: ["办公", "设备", "商用"],
  },
  "办公-耗材": {
    keywords: ["墨盒", "硒鼓", "打印纸", "文件夹", "档案袋"],
    suggestions: ["办公", "耗材", "消耗品"],
  },
  "母婴-喂养": {
    keywords: ["奶瓶", "奶嘴", "奶粉", "辅食", "围兜"],
    suggestions: ["母婴", "喂养", "婴儿", "儿童"],
  },
  "母婴-护理": {
    keywords: ["纸尿裤", "湿巾", "婴儿霜", "洗护用品"],
    suggestions: ["母婴", "护理", "婴儿", "卫生"],
  },
  "汽车-用品": {
    keywords: ["车载充电器", "行车记录仪", "脚垫", "香水", "洗车"],
    suggestions: ["汽车", "用品", "车载", "保养"],
  },
  "户外-装备": {
    keywords: ["帐篷", "睡袋", "登山杖", "背包", "手电筒"],
    suggestions: ["户外", "装备", "露营", "登山"],
  },
  "乐器-弦乐": {
    keywords: ["吉他", "尤克里里", "小提琴", "贝斯"],
    suggestions: ["乐器", "弦乐", "音乐", "演奏"],
  },
  "乐器-键盘": {
    keywords: ["钢琴", "电子琴", "合成器", "MIDI"],
    suggestions: ["乐器", "键盘", "音乐", "演奏"],
  },
  "园艺-工具": {
    keywords: ["铲子", "剪刀", "喷壶", "花盆", "肥料"],
    suggestions: ["园艺", "工具", "种植", "花卉"],
  },
  "食品-零食": {
    keywords: ["薯片", "饼干", "糖果", "巧克力", "坚果"],
    suggestions: ["食品", "零食", "休闲", "消耗品"],
  },
  "食品-饮料": {
    keywords: ["茶叶", "咖啡", "果汁", "饮料", "矿泉水"],
    suggestions: ["食品", "饮料", "消耗品"],
  },
};

export async function getSuggestedTags(itemName: string): Promise<string[]> {
  if (!itemName || itemName.trim().length === 0) {
    return [];
  }

  const normalizedName = itemName.trim().toLowerCase();
  const suggestions = new Set<string>();

  const dbCategories = await db.tagCategories.toArray();

  if (dbCategories.length > 0) {
    for (const category of dbCategories) {
      for (const keyword of category.keywords) {
        if (normalizedName.includes(keyword.toLowerCase())) {
          category.suggestions.forEach((tag) => suggestions.add(tag));
        }
      }
    }
  } else {
    for (const category of Object.values(tagCategories)) {
      for (const keyword of category.keywords) {
        if (normalizedName.includes(keyword.toLowerCase())) {
          category.suggestions.forEach((tag) => suggestions.add(tag));
        }
      }
    }
  }

  return Array.from(suggestions);
}
