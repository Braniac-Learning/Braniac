with open('frontend-deploy/scores.html', 'r') as f:
    content = f.read()

# Find the section to replace
old_section_start = content.find('<section class="score-list" id="allScores">')
old_section_end = content.find('</section>\n</main>', old_section_start) + len('</section>')

new_sections = '''<section class="scores-section" id="topic-scores">
    <h2 class="section-title">TOPIC QUIZZES</h2>
    <div class="scores-grid"></div>
  </section>

  <section class="scores-section" id="document-scores">
    <h2 class="section-title">DOCUMENT QUIZZES</h2>
    <div class="scores-grid"></div>
  </section>

  <section class="scores-section" id="multiplayer-scores">
    <h2 class="section-title">MULTIPLAYER QUIZZES</h2>
    <div class="scores-grid"></div>
  </section>'''

if old_section_start != -1 and old_section_end != -1:
    content = content[:old_section_start] + new_sections + '\n' + content[old_section_end:]
    with open('frontend-deploy/scores.html', 'w') as f:
        f.write(content)
    print("Updated scores.html successfully")
else:
    print(f"Could not find section to replace: start={old_section_start}, end={old_section_end}")
