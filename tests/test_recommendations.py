from backend.recommendations import get_recommendations

def test_recommendation_sources_present():
    r=get_recommendations('tomato_early_blight')
    assert r['management'] and r['sources']
    assert 'no dosage is provided' in r['safety'].lower()
    assert 'follow the product label' in r['safety'].lower()
