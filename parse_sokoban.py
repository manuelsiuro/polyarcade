import re

def parse_levels(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Split by the separator used in the file
    # Based on the text, it uses "---" or just headers starting with ";"
    # Let's split by "---" first as it seems to separate levels clearly in the view I saw
    raw_levels = content.split('---')
    
    cleaned_levels = []
    
    for raw in raw_levels:
        lines = raw.strip().split('\n')
        grid = []
        for line in lines:
            # Skip comment lines
            if line.strip().startswith(';') or line.strip().startswith("'") or not line.strip():
                continue
            
            # Additional check: Does this look like a map line?
            # Must contain # and be mostly map chars
            if '#' in line:
                # Keep the line as is (preserve spaces for formatting) but maybe strip right
                grid.append(line.rstrip())
        
        if grid:
            cleaned_levels.append(grid)
            
    return cleaned_levels

def format_as_js(levels):
    js_code = "        this.levels = [\n"
    for i, lvl in enumerate(levels):
        js_code += f"            // Level {i+1}\n"
        js_code += "            [\n"
        for row in lvl:
            # Escape backslashes or quotes if any (unlikely in Sokoban)
            js_code += f"                '{row}',\n"
        js_code += "            ],\n"
    js_code += "        ];"
    return js_code

def inject_into_js(js_file, levels_js):
    with open(js_file, 'r') as f:
        content = f.read()
    
    # Regex to find the existing levels array
    # Looking for "this.levels = [" ... "];"
    # match non-greedy until ];
    pattern = re.compile(r'this\.levels\s*=\s*\[.*?\];', re.DOTALL)
    
    if not pattern.search(content):
        print("Could not find levels array in JS file")
        return False
        
    new_content = pattern.sub(levels_js, content)
    
    with open(js_file, 'w') as f:
        f.write(new_content)
    return True

levels = parse_levels('levels.txt')
print(f"Parsed {len(levels)} levels.")

js_block = format_as_js(levels)
success = inject_into_js('js/games/IsoSokoban.js', js_block)

if success:
    print("Successfully injected levels into IsoSokoban.js")
else:
    print("Failed to inject.")
