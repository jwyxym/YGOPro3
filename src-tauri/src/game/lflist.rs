use crate::game::regex::LINE_REGEX;
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Serialize, Clone, Debug)]
pub struct LFList {
	content: BTreeMap<String, BTreeMap<i64, i64>>
}

impl LFList {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}
	pub fn init(&mut self, text: String) {
    let lines = text.lines();
    let mut current_table: Option<String> = None;      // 当前正在解析的表名（包含!）
    let mut current_map: BTreeMap<i64, i64> = BTreeMap::new();
    let mut skip_current = false;                      // 当前表是否因重名而跳过

    for line in lines {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;                                   // 忽略空行和注释行
        }

        if line.starts_with('!') {
            // 新表开始，先保存上一个表（如果有且未跳过）
            if let Some(name) = current_table.take() {
                if !skip_current {
                    self.content.insert(name, current_map.clone());
                }
                current_map.clear();
                skip_current = false;
            }

            let name = line.to_string();                // 保留完整的表名（含!）
            if self.content.contains_key(&name) {
                skip_current = true;                     // 表名已存在，跳过整个表
            } else {
                current_table = Some(name);
            }
        } else {
            if skip_current {
                continue;                                 // 当前表被跳过，忽略该行
            }

            // 普通行格式："卡片ID 限制数量 [--注释]"
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 2 {
                continue;                                 // 格式错误，至少需要两部分
            }
            if let (Ok(key), Ok(value)) = (parts[0].parse::<i64>(), parts[1].parse::<i64>()) {
                current_map.insert(key, value);
            }
            // 解析失败的行忽略
        }
    }

    // 处理最后一个表
    if let Some(name) = current_table {
        if !skip_current {
            self.content.insert(name, current_map);
        }
    }
}
}
