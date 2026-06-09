const fs = require('fs');
const path = require('path');

const localesDir = 'D:/game/MDPro3/Data/locales';
const ygoProLanguageDir = 'src/script/language';
const constantTsPath = 'src/script/constant.ts';
const gameTsPath = 'src/script/game.ts';
const cdbDestDir = 'src-tauri/target/debug/cdb';
const stringsDestDir = 'src-tauri/target/debug/strings';

if (!fs.existsSync(cdbDestDir)) fs.mkdirSync(cdbDestDir, { recursive: true });
if (!fs.existsSync(stringsDestDir)) fs.mkdirSync(stringsDestDir, { recursive: true });

// Normalize keys to valid TS identifiers
function getIdentifierName(lang) {
    return lang.replace(/[^a-zA-Z0-9]/g, '_');
}

function run() {
    const zhCnContent = fs.readFileSync(path.join(ygoProLanguageDir, 'Zh-CN.ts'), 'utf8');
    const locales = fs.readdirSync(localesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const generatedLangs = [];

    for (const lang of locales) {
        if (lang === 'IDS' || lang === 'voice') continue; // Skip non-language dirs
        
        const langDir = path.join(localesDir, lang);
        const transConfPath = path.join(langDir, 'translation.conf');
        const cdbPath = path.join(langDir, 'cards.cdb');
        const stringsConfPath = path.join(langDir, 'strings.conf');

        // Copy CDB and Strings if they exist
        if (fs.existsSync(cdbPath)) {
            fs.copyFileSync(cdbPath, path.join(cdbDestDir, `cards-${lang}.cdb`));
        }
        if (fs.existsSync(stringsConfPath)) {
            fs.copyFileSync(stringsConfPath, path.join(stringsDestDir, `strings-${lang}.conf`));
        }

        // Parse translation.conf
        const transMap = new Map();
        if (fs.existsSync(transConfPath)) {
            const transContent = fs.readFileSync(transConfPath, 'utf8');
            const lines = transContent.split(/\r?\n/);
            for (const line of lines) {
                if (line.includes('->')) {
                    const parts = line.split('->');
                    if (parts.length === 2) {
                        transMap.set(parts[0].trim(), parts[1].trim());
                    }
                }
            }
        }

        // Generate lang.ts
        const idName = getIdentifierName(lang);
        let langTsContent = zhCnContent;

        // Replace Zh_CN variable name
        langTsContent = langTsContent.replace(/Zh_CN/g, idName);

        // Replace strings
        langTsContent = langTsContent.replace(/=\s*'([^']+)'/g, (match, p1) => {
            if (transMap.has(p1)) {
                return `= '${transMap.get(p1).replace(/'/g, "\\'")}'`;
            }
            return match;
        });

        // Write file
        fs.writeFileSync(path.join(ygoProLanguageDir, `${lang}.ts`), langTsContent);
        generatedLangs.push({ lang, idName });
        console.log(`Generated TS and copied assets for ${lang}`);
    }

    // Update constant.ts
    let constantContent = fs.readFileSync(constantTsPath, 'utf8');
    const langObjMatch = constantContent.match(/const LANGUAGE = {([^}]*)};/);
    if (langObjMatch) {
        let langObjStr = generatedLangs.map(l => `\t${l.idName} : '${l.lang}'`).join(',\n');
        constantContent = constantContent.replace(langObjMatch[0], `const LANGUAGE = {\n${langObjStr}\n};`);
        fs.writeFileSync(constantTsPath, constantContent);
        console.log('Updated constant.ts');
    }

    // Update game.ts
    let gameContent = fs.readFileSync(gameTsPath, 'utf8');
    
    // Remove existing imports from language folder except string and i18n
    gameContent = gameContent.replace(/import \w+ from '\.\/language\/[a-zA-Z0-9-_]+';\n/g, '');
    
    // Add new imports
    const importStr = generatedLangs.map(l => `import ${l.idName} from './language/${l.lang}';`).join('\n') + '\n';
    gameContent = gameContent.replace(/(import \{ I18N_KEYS \} from '\.\/language\/i18n';\n)/, `$1${importStr}`);

    // Update switch statement
    const switchRegex = /switch\s*\(this\.get\.system\(CONSTANT\.KEYS\.I18N\)\)\s*\{[\s\S]*?\}/;
    const switchCases = generatedLangs.map(l => `\t\t\t\tcase CONSTANT.LANGUAGE.${l.idName}:\n\t\t\t\t\treturn new YGOPRO_STR(${l.idName}[key]).toString(replace);`).join('\n');
    const switchReplacement = `switch (this.get.system(CONSTANT.KEYS.I18N)) {\n${switchCases}\n\t\t\t}`;
    gameContent = gameContent.replace(switchRegex, switchReplacement);
    
    // Also update the fallback return right after switch
    gameContent = gameContent.replace(/return new YGOPRO_STR\(\w+\[key\]\)\.toString\(\);/g, `return new YGOPRO_STR(${generatedLangs.find(l => l.lang === 'zh-CN')?.idName || generatedLangs[0].idName}[key]).toString();`);

    fs.writeFileSync(gameTsPath, gameContent);
    console.log('Updated game.ts');
}

run();
