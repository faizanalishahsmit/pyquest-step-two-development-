/* ==========================================================================
   PYQUEST: SOLO CODE LEVELING (AAA+ EDITION)
   File 4/5: data_classes.js — 3 Hunter Classes x 10 Levels Bilingual Database
   ========================================================================== */

(function () {
  "use strict";

  if (window.PYQUEST_DATA) return;

  const HUNTER_RANKS = [
    { minXP: 0, badge: "🛡️ E-Rank Rookie", short: "E-RANK" },
    { minXP: 120, badge: "⚔️ D-Rank Striker", short: "D-RANK" },
    { minXP: 280, badge: "🔮 C-Rank Vanguard", short: "C-RANK" },
    { minXP: 480, badge: "⚡ B-Rank Cyber Elite", short: "B-RANK" },
    { minXP: 720, badge: "🔥 A-Rank Gate Breaker", short: "A-RANK" },
    { minXP: 1000, badge: "👑 S-Rank Shadow Monarch", short: "S-RANK" },
  ];

  const CLASSES = {
    /* ======================================================================
       CLASS 1: PYTHON — SHADOW NECROMANCER
       ====================================================================== */
    python: {
      id: "python",
      icon: "🐍",
      name: "PYTHON NECROMANCER",
      title: "Python — Shadow Necromancer",
      shadowBossName: "IGRIS-PY // SHADOW BYTE KNIGHT",
      shadowBuffText: "👻 IGRIS-PY: +5s Boss Timer & +15% XP",
      levels: [
        {
          level: 1,
          gateRank: "E-Rank",
          enemyName: "INDENTATION IMP",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What will this Python f-string output to the Hunter System console?",
            ur: "Yeh Python f-string Hunter System console par kya output dega?",
          },
          code: `hunter = "Jin"\nlevel = 5\nprint(f"{hunter} -> Lv.{level * 2}")`,
          options: ["Jin -> Lv.10", "{hunter} -> Lv.10", "Jin -> Lv.52", "SyntaxError"],
          correctIndex: 0,
          explain: {
            en: "f-strings evaluate expressions inside {} directly: level * 2 becomes 10, producing 'Jin -> Lv.10'.",
            ur: "Python f-strings curly braces {} ke andar expression calculate karti hain: 5 * 2 = 10 hota hai, is liye 'Jin -> Lv.10' print hoga.",
          },
        },
        {
          level: 2,
          gateRank: "E-Rank",
          enemyName: "SLICE PHANTOM",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "Which slice extracts the reversed list of shadow ranks?",
            ur: "List ko ulta (reverse) karne ke liye kaunsa Python slice sahi output dega?",
          },
          code: `ranks = ["E", "C", "A", "S"]\nprint(ranks[::-1])`,
          options: ['["S", "A", "C", "E"]', '["E", "C", "A"]', '["S"]', "IndexError"],
          correctIndex: 0,
          explain: {
            en: "A step of -1 in slicing [::-1] traverses the list from right to left, returning ['S', 'A', 'C', 'E'].",
            ur: "[::-1] slice ka step -1 hai jo list ko aakhir se shuru tak reverse kar deta hai.",
          },
        },
        {
          level: 3,
          gateRank: "D-Rank",
          enemyName: "LOOP GARGOYLE",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: Why does this function return None instead of the doubled damage?",
            ur: "BUG BREAKER: Yeh function doubled damage ke bajaye None kyun return kar raha hai?",
          },
          code: `def strike_power(atk):\n    dmg = atk * 2\n    print(dmg)\n\nresult = strike_power(40)`,
          options: [
            "Missing 'return dmg' statement",
            "atk must be a string",
            "def should be function",
            "Indentation error on line 2",
          ],
          correctIndex: 0,
          explain: {
            en: "print() only displays text on screen. Without 'return dmg', a Python function returns None by default.",
            ur: "print() sirf screen par dikhata hai. Value wapas bhejne ke liye 'return dmg' likhna zaroori hai warna Python None deta hai.",
          },
        },
        {
          level: 4,
          gateRank: "D-Rank",
          enemyName: "DICT SPECTER",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What does .get('mana', 100) return when 'mana' is not in the dictionary?",
            ur: "Jab 'mana' key dictionary mein मौजूद na ho to .get('mana', 100) kya return karega?",
          },
          code: `stats = {"hp": 250, "atk": 80}\nprint(stats.get("mana", 100))`,
          options: ["100", "None", "KeyError", "250"],
          correctIndex: 0,
          explain: {
            en: "dict.get(key, default) safely returns the fallback value (100) instead of raising a KeyError.",
            ur: "dict.get(key, default) KeyError dene ke bajaye di gayi default value (100) safely return karta hai.",
          },
        },
        {
          level: 5,
          gateRank: "C-Rank",
          enemyName: "COMPREHENSION GOLEM",
          isBoss: false,
          mode: "ultimate",
          prompt: {
            en: "ULTIMATE TERMINAL: Type the Python built-in function call to get the number of items in `shadows`.",
            ur: "ULTIMATE TERMINAL: `shadows` list ki lambai (length) nikalne ke liye Python code type karein.",
          },
          code: `shadows = ["Igris", "Tank", "Iron", "Beru"]\n# Type expression to return 4:`,
          acceptedAnswers: ["len(shadows)", "print(len(shadows))"],
          hint: "len(shadows)",
          explain: {
            en: "len(shadows) returns the total item count (4) in O(1) constant time.",
            ur: "Python mein kisi bhi list ya string ke elements ginne ke liye len(shadows) istemal hota hai.",
          },
        },
        {
          level: 6,
          gateRank: "C-Rank",
          enemyName: "MUTABLE HYDRA",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: What is the output after modifying `b` when `b = a`?",
            ur: "BUG BREAKER: Jab `b = a` kiya jaye aur `b.append(99)` ho, to `a` print karne par kya aayega?",
          },
          code: `a = [10, 20]\nb = a\nb.append(99)\nprint(a)`,
          options: ["[10, 20, 99]", "[10, 20]", "[99]", "TypeError"],
          correctIndex: 0,
          explain: {
            en: "`b = a` copies the list reference, not a new list! Both `a` and `b` point to `[10, 20, 99]`.",
            ur: "`b = a` nayi list nahi banata balki memory reference share karta hai, is liye `a` bhi `[10, 20, 99]` ban jata hai.",
          },
        },
        {
          level: 7,
          gateRank: "B-Rank",
          enemyName: "LAMBDA WRAITH",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What will this list comprehension with a filter condition produce?",
            ur: "Condition ke sath yeh list comprehension kya list banayega?",
          },
          code: `nums = [1, 2, 3, 4]\ncrits = [n * 10 for n in nums if n % 2 == 0]\nprint(crits)`,
          options: ["[20, 40]", "[10, 20, 30, 40]", "[2, 4]", "[10, 30]"],
          correctIndex: 0,
          explain: {
            en: "Only even numbers (2 and 4) pass `n % 2 == 0`, and each is multiplied by 10 to give `[20, 40]`.",
            ur: "`n % 2 == 0` sirf even numbers (2 aur 4) select karta hai aur `n * 10` unhein `[20, 40]` bana deta hai.",
          },
        },
        {
          level: 8,
          gateRank: "B-Rank",
          enemyName: "EXCEPTION REAPER",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: Which block ALWAYS executes whether an exception occurs or not?",
            ur: "BUG BREAKER: Try/Except mein woh kaunsa block hai jo error aaye ya na aaye HAMESHA chalta hai?",
          },
          code: `try:\n    gate = 10 / 0\nexcept ZeroDivisionError:\n    print("Blocked!")\nfinally:\n    print("System Synced")`,
          options: ["finally", "except", "else", "try"],
          correctIndex: 0,
          explain: {
            en: "The `finally` block is guaranteed to run after `try` and `except`, ideal for cleanup logic.",
            ur: "`finally` block har haal mein run hota hai chahe exception aaye ya na aaye.",
          },
        },
        {
          level: 9,
          gateRank: "A-Rank",
          enemyName: "GENERATOR ARCHLICH",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "Which keyword turns a standard Python function into a lazy generator?",
            ur: "Kaunsa keyword ek Python function ko lazy generator mein tabdeel kar deta hai?",
          },
          code: `def mana_stream():\n    for i in range(3):\n        yield i * 50`,
          options: ["yield", "return", "async", "await"],
          correctIndex: 0,
          explain: {
            en: "`yield` pauses function state and produces values one at a time on demand without storing the full list in memory.",
            ur: "`yield` keyword function ko pause karke ek waqt mein ek value generate karta hai jis se memory bachti hai.",
          },
        },
        {
          level: 10,
          gateRank: "S-Rank BOSS",
          enemyName: "S-RANK PYTHON OVERLORD: METACLASS TITAN",
          isBoss: true,
          mode: "ultimate",
          prompt: {
            en: "🌌 S-RANK BOSS ULTIMATE: Type the Python statement to print `'ARISE'` in uppercase using `.upper()` on variable `cmd`.",
            ur: "🌌 S-RANK BOSS ULTIMATE: Variable `cmd` par `.upper()` laga kar print karne ka code likhein (`cmd.upper()`).",
          },
          code: `cmd = "arise"\n# Type expression that evaluates to "ARISE":`,
          acceptedAnswers: ["cmd.upper()", "print(cmd.upper())", '"arise".upper()'],
          hint: "cmd.upper()",
          explain: {
            en: "DIRECT S-RANK CRITICAL! `cmd.upper()` converts the string `'arise'` to `'ARISE'`, shattering the Overlord's core!",
            ur: "SHANDAAR S-RANK STRIKE! `cmd.upper()` string ko capital `'ARISE'` mein badal kar Boss ka core tod deta hai!",
          },
        },
      ],
    },

    /* ======================================================================
       CLASS 2: JAVASCRIPT — CYBER ASSASSIN
       ====================================================================== */
    javascript: {
      id: "javascript",
      icon: "⚡",
      name: "JS CYBER ASSASSIN",
      title: "JavaScript — Cyber Assassin",
      shadowBossName: "BERU-JS // ASYNC VOLT KING",
      shadowBuffText: "👻 BERU-JS: +5s Boss Timer & +15% XP",
      levels: [
        {
          level: 1,
          gateRank: "E-Rank",
          enemyName: "COERCION DRONE",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What does strict equality `===` evaluate here in JavaScript?",
            ur: "JavaScript mein strict equality `===` yahan kya result degi?",
          },
          code: `const rank = 10;\nconst input = "10";\nconsole.log(rank === input);`,
          options: ["false", "true", "10", "TypeError"],
          correctIndex: 0,
          explain: {
            en: "`===` checks both value AND data type without type coercion. Number 10 is not strictly equal to String '10'.",
            ur: "`===` value aur data type dono check karta hai. Number 10 aur String '10' ki type alag hai is liye false aayega.",
          },
        },
        {
          level: 2,
          gateRank: "E-Rank",
          enemyName: "TEMPLATE PHANTOM",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What is logged by this ES6 arrow function and template literal?",
            ur: "ES6 arrow function aur template literal console par kya print karenge?",
          },
          code: `const crit = (x) => \`DMG: \${x * 3}\`;\nconsole.log(crit(15));`,
          options: ["DMG: 45", "DMG: ${x * 3}", "45", "undefined"],
          correctIndex: 0,
          explain: {
            en: "Backtick template literals interpolate `${x * 3}` as 45, returning `'DMG: 45'`.",
            ur: "Backticks (`) ke andar `${x * 3}` evaluate ho kar 45 banta hai, jis se `'DMG: 45'` return hota hai.",
          },
        },
        {
          level: 3,
          gateRank: "D-Rank",
          enemyName: "SCOPE STALKER",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: Why does `hp = 50` throw a TypeError here?",
            ur: "BUG BREAKER: Yahan `hp = 50` likhne par TypeError kyun aata hai?",
          },
          code: `const hp = 100;\nhp = 50;\nconsole.log(hp);`,
          options: [
            "Cannot reassign a variable declared with const",
            "hp must be declared with var only",
            "Numbers cannot be stored in const",
            "Missing semicolon on line 1",
          ],
          correctIndex: 0,
          explain: {
            en: "Variables declared with `const` have a constant binding and cannot be reassigned. Use `let` for mutable values.",
            ur: "`const` se banaye gaye variable ko dobara nayi value assign nahi ki ja sakti. Badalne wali value ke liye `let` use karein.",
          },
        },
        {
          level: 4,
          gateRank: "D-Rank",
          enemyName: "ARRAY SHREDDER",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What array does `.map()` return from this hunter strike list?",
            ur: "`.map()` method is array par chalne ke baad kya return karega?",
          },
          code: `const hits = [2, 4, 6];\nconst boosted = hits.map(n => n + 1);\nconsole.log(boosted);`,
          options: ["[3, 5, 7]", "[2, 4, 6]", "15", "[true, true, true]"],
          correctIndex: 0,
          explain: {
            en: "`.map()` transforms every element in the array using the callback, adding 1 to each element: `[3, 5, 7]`.",
            ur: "`.map()` har element par function chala kar naya array `[3, 5, 7]` banata hai.",
          },
        },
        {
          level: 5,
          gateRank: "C-Rank",
          enemyName: "SPREAD SENTINEL",
          isBoss: false,
          mode: "ultimate",
          prompt: {
            en: "ULTIMATE TERMINAL: Type the JavaScript expression to get the number of elements in `gates`.",
            ur: "ULTIMATE TERMINAL: `gates` array ke elements ki tadad (length) nikalne ka JS code likhein.",
          },
          code: `const gates = ["E", "B", "A", "S"];\n// Type expression that evaluates to 4:`,
          acceptedAnswers: ["gates.length", "console.log(gates.length)"],
          hint: "gates.length",
          explain: {
            en: "In JavaScript, `gates.length` returns the number of elements in the array.",
            ur: "JavaScript mein array ki lambai maloom karne ke liye `.length` property (`gates.length`) use hoti hai.",
          },
        },
        {
          level: 6,
          gateRank: "C-Rank",
          enemyName: "DESTRUCTURE DEMON",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What is logged when destructuring `monarch` with a default value?",
            ur: "Object destructuring ke dauran default value ke sath kya output aayega?",
          },
          code: `const monarch = { name: "Jin" };\nconst { name, rank = "S" } = monarch;\nconsole.log(name, rank);`,
          options: ["Jin S", "Jin undefined", "undefined S", "ReferenceError"],
          correctIndex: 0,
          explain: {
            en: "Since `rank` does not exist on `monarch`, the destructuring default `'S'` is used.",
            ur: "Kyunke `monarch` object mein `rank` मौजूद nahi hai, is liye default value `'S'` istemal hoti hai.",
          },
        },
        {
          level: 7,
          gateRank: "B-Rank",
          enemyName: "NULLISH SPECTER",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: Why is `??` (Nullish Coalescing) safer than `||` when `xp` is `0`?",
            ur: "BUG BREAKER: Jab `xp` ki value `0` ho, to `||` ke muqable mein `??` kyun behtar hai?",
          },
          code: `const xp = 0;\nconsole.log(xp || 100); // 100\nconsole.log(xp ?? 100); // 0`,
          options: [
            "?? only falls back on null or undefined, preserving valid 0",
            "?? converts 0 into a string",
            "|| throws an error on 0",
            "?? multiplies both operands",
          ],
          correctIndex: 0,
          explain: {
            en: "`||` treats `0` and `''` as falsy and overwrites them. `??` only falls back when the left side is `null` or `undefined`.",
            ur: "`||` operator `0` ko false samajh kar 100 de deta hai, jabke `??` sirf `null` ya `undefined` hone par fallback deta hai.",
          },
        },
        {
          level: 8,
          gateRank: "B-Rank",
          enemyName: "PROMISE VALKYRIE",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "Which keyword pauses execution inside an `async` function until a Promise resolves?",
            ur: "`async` function ke andar Promise resolve hone tak intezar karne ke liye kaunsa keyword lagta hai?",
          },
          code: `async function raidGate() {\n  const data = await fetchBoss();\n  return data;\n}`,
          options: ["await", "yield", "defer", "resolve"],
          correctIndex: 0,
          explain: {
            en: "`await` suspends the `async` function until the Promise settles and unwraps its resolved value.",
            ur: "`await` keyword `async` function ko tab tak rokta hai jab tak Promise ka result na aa jaye.",
          },
        },
        {
          level: 9,
          gateRank: "A-Rank",
          enemyName: "CLOSURE PHANTOM",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What will calling `combo()` twice output due to lexical closure?",
            ur: "Closure ki wajah se `combo()` ko do dafa call karne par kya output aayega?",
          },
          code: `function makeCombo() {\n  let hits = 0;\n  return () => ++hits;\n}\nconst combo = makeCombo();\nconsole.log(combo(), combo());`,
          options: ["1 2", "0 0", "1 1", "undefined undefined"],
          correctIndex: 0,
          explain: {
            en: "The inner arrow function closes over `hits`, preserving and incrementing it across calls (`1` then `2`).",
            ur: "Inner function apne outer scope ke `hits` variable ko yaad rakhta hai (Closure), is liye pehli call par 1 aur doosri par 2 aata hai.",
          },
        },
        {
          level: 10,
          gateRank: "S-Rank BOSS",
          enemyName: "S-RANK JS OVERLORD: EVENT LOOP LEVIATHAN",
          isBoss: true,
          mode: "ultimate",
          prompt: {
            en: "🌌 S-RANK BOSS ULTIMATE: Type the JS expression to convert string `cmd` to uppercase (`cmd.toUpperCase()`).",
            ur: "🌌 S-RANK BOSS ULTIMATE: String `cmd` ko uppercase mein badalne ke liye JS expression type karein (`cmd.toUpperCase()`).",
          },
          code: `const cmd = "arise";\n// Type expression that evaluates to "ARISE":`,
          acceptedAnswers: ["cmd.toUpperCase()", "console.log(cmd.toUpperCase())"],
          hint: "cmd.toUpperCase()",
          explain: {
            en: "LIGHTNING S-RANK FINISH! `cmd.toUpperCase()` unleashes the Cyber Assassin's ultimate strike!",
            ur: "ZABARDAST S-RANK FINISH! `cmd.toUpperCase()` ne Event Loop Leviathan ko mukammal shikast de di!",
          },
        },
      ],
    },

    /* ======================================================================
       CLASS 3: C++ — BERSERKER MONARCH
       ====================================================================== */
    cpp: {
      id: "cpp",
      icon: "⚔️",
      name: "C++ BERSERKER MONARCH",
      title: "C++ — Berserker Monarch",
      shadowBossName: "TUSK-CPP // MEMORY COLOSSUS",
      shadowBuffText: "👻 TUSK-CPP: +5s Boss Timer & +15% XP",
      levels: [
        {
          level: 1,
          gateRank: "E-Rank",
          enemyName: "SEMICOLON SENTINEL",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What does this C++ integer division output to `std::cout`?",
            ur: "C++ mein do integers ki division `7 / 2` kya output degi?",
          },
          code: `int dmg = 7 / 2;\nstd::cout << dmg;`,
          options: ["3", "3.5", "4", "0"],
          correctIndex: 0,
          explain: {
            en: "In C++, dividing two `int` values performs integer division and truncates the fractional part (`3.5` becomes `3`).",
            ur: "C++ mein jab do `int` divide hote hain to point ke baad wala hissa kat jata hai, is liye `7 / 2` ka jawab `3` aata hai.",
          },
        },
        {
          level: 2,
          gateRank: "E-Rank",
          enemyName: "REFERENCE GOLEM",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What is the value of `hp` after modifying its C++ reference `alias`?",
            ur: "Reference variable `alias` ko badalne ke baad `hp` ki value kya hogi?",
          },
          code: `int hp = 100;\nint& alias = hp;\nalias += 50;\nstd::cout << hp;`,
          options: ["150", "100", "50", "Compile Error"],
          correctIndex: 0,
          explain: {
            en: "`int& alias = hp` binds `alias` directly to `hp`'s memory address, so adding 50 updates `hp` to 150.",
            ur: "`int& alias` asali `hp` variable ka hi doosra naam (reference) hai, is liye `alias += 50` se `hp` 150 ho jata hai.",
          },
        },
        {
          level: 3,
          gateRank: "D-Rank",
          enemyName: "POINTER STALKER",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: Which operator dereferences pointer `ptr` to read the value 99?",
            ur: "BUG BREAKER: Pointer `ptr` ke andar chhupi value (99) parhne ke liye kaunsa operator lagta hai?",
          },
          code: `int atk = 99;\nint* ptr = &atk;\nstd::cout << *ptr;`,
          options: [
            "*ptr (Dereference operator *)",
            "&ptr (Address-of operator &)",
            "->ptr (Arrow operator)",
            "~ptr (Bitwise NOT)",
          ],
          correctIndex: 0,
          explain: {
            en: "`*ptr` dereferences the memory address stored in `ptr`, accessing the integer value `99`.",
            ur: "`*ptr` (dereference operator) pointer ke address par rakhi asali value `99` nikal kar deta hai.",
          },
        },
        {
          level: 4,
          gateRank: "D-Rank",
          enemyName: "VECTOR GARGOYLE",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "Which `std::vector` method appends a new element to the end of the vector?",
            ur: "`std::vector` ke aakhir mein naya element add karne ke liye kaunsa method use hota hai?",
          },
          code: `std::vector<int> crits = {10, 20};\ncrits.push_back(30);\nstd::cout << crits.size();`,
          options: ["push_back()", "append()", "add()", "insert_end()"],
          correctIndex: 0,
          explain: {
            en: "`push_back(30)` appends 30 to the end of `std::vector`, increasing its `.size()` to 3.",
            ur: "C++ STL vector mein aakhir par item jorne ke liye `.push_back()` method istemal hota hai.",
          },
        },
        {
          level: 5,
          gateRank: "C-Rank",
          enemyName: "STL EXECUTIONER",
          isBoss: false,
          mode: "ultimate",
          prompt: {
            en: "ULTIMATE TERMINAL: Type the C++ expression to get the number of elements in `std::vector<int> army`.",
            ur: "ULTIMATE TERMINAL: `army` vector ka size maloom karne ke liye C++ expression type karein (`army.size()`).",
          },
          code: `std::vector<int> army = {1, 2, 3, 4};\n// Type expression that returns 4:`,
          acceptedAnswers: ["army.size()", "std::cout << army.size();", "army.size();"],
          hint: "army.size()",
          explain: {
            en: "`army.size()` returns the number of elements currently held in the `std::vector`.",
            ur: "C++ `std::vector` mein elements ki tadad nikalne ke liye `army.size()` call kiya jata hai.",
          },
        },
        {
          level: 6,
          gateRank: "C-Rank",
          enemyName: "CONST GUARDIAN",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: Why do C++ hunters pass large vectors as `const std::vector<int>& v`?",
            ur: "BUG BREAKER: Bade vectors ko function mein `const std::vector<int>& v` ke taur par kyun bheja jata hai?",
          },
          code: `void scan(const std::vector<int>& v) {\n    std::cout << v.size();\n}`,
          options: [
            "Avoids expensive memory copying while preventing accidental modification",
            "It forces the vector to delete its elements",
            "C++ cannot pass vectors by value",
            "It converts the vector into an array",
          ],
          correctIndex: 0,
          explain: {
            en: "Passing by `const` reference (`const T&`) is zero-copy (fast!) and guarantees the function won't mutate the caller's data.",
            ur: "`const &` lagane se poora vector memory mein copy nahi hota (fast speed) aur `const` usay ghalti se badalne se bhi bachata hai.",
          },
        },
        {
          level: 7,
          gateRank: "B-Rank",
          enemyName: "HEAP BEHEMOTH",
          isBoss: false,
          mode: "heavy",
          prompt: {
            en: "BUG BREAKER: What happens if memory allocated with `new` is never freed with `delete`?",
            ur: "BUG BREAKER: Agar `new` se li gayi heap memory ko `delete` na kiya jaye to kya bug paida hota hai?",
          },
          code: `void spawnShadow() {\n    int* p = new int(500);\n    // missing cleanup!\n}`,
          options: ["Memory Leak", "Syntax Error", "Stack Underflow", "Division by Zero"],
          correctIndex: 0,
          explain: {
            en: "Failing to `delete` heap allocations causes a Memory Leak; modern C++ uses `std::unique_ptr` (RAII) to prevent this.",
            ur: "Heap memory ko free na karne se Memory Leak hota hai. Modern C++ mein is se bachne ke liye smart pointers use hote hain.",
          },
        },
        {
          level: 8,
          gateRank: "B-Rank",
          enemyName: "POLYMORPH DRAGON",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "Which keyword enables dynamic runtime polymorphism for a base class method in C++?",
            ur: "Base class ke function ko derived class mein override karne (runtime polymorphism) ke liye kaunsa keyword lagta hai?",
          },
          code: `class Hunter {\npublic:\n    virtual void slash() { }\n};`,
          options: ["virtual", "static", "friend", "inline"],
          correctIndex: 0,
          explain: {
            en: "Marking a base method `virtual` creates a vtable dispatch so calling it via a base pointer invokes the derived override.",
            ur: "`virtual` keyword lagane se runtime par sahi derived class ka overridden function call hota hai.",
          },
        },
        {
          level: 9,
          gateRank: "A-Rank",
          enemyName: "TEMPLATE ARCHON",
          isBoss: false,
          mode: "light",
          prompt: {
            en: "What does `template <typename T>` allow this C++ function to do?",
            ur: "`template <typename T>` is C++ function ko kya taqat deta hai?",
          },
          code: `template <typename T>\nT maxStrike(T a, T b) {\n    return (a > b) ? a : b;\n}`,
          options: [
            "Work generically with any data type (int, double, etc.) at compile time",
            "Run only on strings",
            "Disable compiler type checking",
            "Allocate heap memory automatically",
          ],
          correctIndex: 0,
          explain: {
            en: "C++ templates generate type-safe code for any type `T` (`int`, `float`, `double`) with zero runtime overhead.",
            ur: "Templates ki madad se ek hi function har data type (`int`, `double` waghera) ke liye compile-time par kaam kar sakta hai.",
          },
        },
        {
          level: 10,
          gateRank: "S-Rank BOSS",
          enemyName: "S-RANK C++ OVERLORD: SEGFAULT ABYSS MONARCH",
          isBoss: true,
          mode: "ultimate",
          prompt: {
            en: "🌌 S-RANK BOSS ULTIMATE: Type the C++ dereference expression to access the value pointed to by `corePtr` (`*corePtr`).",
            ur: "🌌 S-RANK BOSS ULTIMATE: Pointer `corePtr` ki value dereference karne ke liye C++ code likhein (`*corePtr`).",
          },
          code: `int bossCore = 9999;\nint* corePtr = &bossCore;\n// Type dereference expression for corePtr:`,
          acceptedAnswers: ["*corePtr", "std::cout << *corePtr;", "*corePtr;"],
          hint: "*corePtr",
          explain: {
            en: "BERSERKER S-RANK OBLITERATION! `*corePtr` strikes straight into the Boss's memory address, cleaving the Segfault Monarch!",
            ur: "BERSERKER S-RANK DHAMAKA! `*corePtr` ne seedha Boss ke memory address par waar karke usay hara diya!",
          },
        },
      ],
    },
  };

  window.PYQUEST_DATA = {
    HUNTER_RANKS,
    CLASSES,
  };
})();
