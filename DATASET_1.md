# Dataset

## Primary training/evaluation dataset
**Dataset name:** PlantVillage (curated re-release: `geraldmc/plantvillage-full`, revision `v0.1.0`)  
**Source:** Hugging Face dataset card, derived from the upstream PlantVillage repository  
**URL:** https://huggingface.co/datasets/geraldmc/plantvillage-full  
**License listed by this re-release:** CC0 1.0  
**Crops in full dataset:** 14 host species  
**Disease/health classes in full dataset:** 38 crop-condition classes  
**Number of images:** 54,304 in the cited re-release  

The project filters only the 11 classes listed in `ml/data/classes.py`. The download script records the exact selected count after filtering and exact-deduplication instead of hard-coding a derived count.

## Why this dataset
It provides enough labeled examples across tomato, maize and potato to support a reproducible multi-class benchmark. Its main weakness is controlled imaging/backgrounds, so the system explicitly uses uncertainty rejection and documents field-domain limitations.

## Optional field-condition reference
**Dataset name:** PlantDoc  
**Source:** original PlantDoc project / standardized repository  
**URL:** https://github.com/pratikkayal/PlantDoc-Dataset  
**License:** CC BY 4.0 (as documented by the standardized repository; verify upstream terms before redistribution)  
**Crops:** 13 plant species  
**Classes:** 29 disease/health classes  
**Number of images:** 2,585  

PlantDoc is documented as a recommended external field-condition/OOD validation dataset, but it is not silently mixed into the primary benchmark because label mappings and capture conditions differ. This preserves a clear test protocol.

## Leakage prevention
The PlantVillage re-release exposes `leaf_id` and an upstream leaf-grouped held-out split. `prepare_dataset.py` preserves the upstream test split and partitions only upstream training rows into train/validation by `leaf_id`, preventing different photos of the same physical leaf from crossing train/validation where grouping metadata exists.

## Duplicate handling
The downloader computes SHA-256 over normalized JPEG bytes and skips exact duplicates. More aggressive perceptual-deduplication can be added, but exact hashing avoids removing genuinely similar leaves by mistake.
