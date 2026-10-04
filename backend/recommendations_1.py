from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
KB=json.loads((ROOT/'knowledge_base/recommendations.json').read_text())
I18N=json.loads((ROOT/'knowledge_base/i18n.json').read_text())

def get_recommendations(label, lang='en'):
    if label.endswith('_healthy'):
        return {"management":[],"prevention":[],"monitoring":["Continue routine scouting and good crop hygiene."],"sources":[KB['_policy']['general_source']],"safety":KB['_policy']['chemical_safety']}
    item=KB.get(label)
    if not item:
        return {"management":[],"prevention":[],"monitoring":["Seek confirmation from an agricultural extension officer."],"sources":[KB['_policy']['general_source']],"safety":KB['_policy']['chemical_safety']}
    return {**item,"safety":KB['_policy']['chemical_safety']}
