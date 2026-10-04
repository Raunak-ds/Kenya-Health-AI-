"""Farms and crop plots router."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Farm, CropPlot, Scan, User
from backend.schemas import (
    FarmCreate, FarmUpdate, FarmOut,
    PlotCreate, PlotUpdate, PlotOut
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/farms", tags=["farms"])


def _farm_out(farm: Farm, db: Session) -> FarmOut:
    scan_count = db.query(Scan).filter(Scan.farm_id == farm.id).count()
    return FarmOut(
        id=farm.id,
        name=farm.name,
        county=farm.county,
        sub_county=farm.sub_county,
        approximate_location=farm.approximate_location,
        size_value=farm.size_value,
        size_unit=farm.size_unit,
        notes=farm.notes,
        created_at=farm.created_at,
        plot_count=len(farm.plots),
        scan_count=scan_count,
    )


# ──────────────────────────── Farms ────────────────────────────

@router.post("", response_model=FarmOut, status_code=201)
def create_farm(
    payload: FarmCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = Farm(owner_id=user.id, **payload.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return _farm_out(farm, db)


@router.get("", response_model=List[FarmOut])
def list_farms(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farms = db.query(Farm).filter(Farm.owner_id == user.id).all()
    return [_farm_out(f, db) for f in farms]


@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    return _farm_out(farm, db)


@router.put("/{farm_id}", response_model=FarmOut)
def update_farm(
    farm_id: str,
    payload: FarmUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(farm, field, value)
    db.commit()
    db.refresh(farm)
    return _farm_out(farm, db)


@router.delete("/{farm_id}", status_code=204)
def delete_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    db.delete(farm)
    db.commit()


# ──────────────────────────── Crop Plots ────────────────────────────

@router.post("/{farm_id}/plots", response_model=PlotOut, status_code=201)
def create_plot(
    farm_id: str,
    payload: PlotCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    plot = CropPlot(farm_id=farm_id, **payload.model_dump())
    db.add(plot)
    db.commit()
    db.refresh(plot)
    scan_count = db.query(Scan).filter(Scan.plot_id == plot.id).count()
    return PlotOut(**{c.name: getattr(plot, c.name) for c in plot.__table__.columns}, scan_count=scan_count)


@router.get("/{farm_id}/plots", response_model=List[PlotOut])
def list_plots(
    farm_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    plots = db.query(CropPlot).filter(CropPlot.farm_id == farm_id).all()
    result = []
    for p in plots:
        sc = db.query(Scan).filter(Scan.plot_id == p.id).count()
        result.append(PlotOut(**{c.name: getattr(p, c.name) for c in p.__table__.columns}, scan_count=sc))
    return result


@router.get("/{farm_id}/plots/{plot_id}", response_model=PlotOut)
def get_plot(
    farm_id: str,
    plot_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    plot = db.query(CropPlot).filter(CropPlot.id == plot_id, CropPlot.farm_id == farm_id).first()
    if not plot:
        raise HTTPException(404, "Plot not found")
    sc = db.query(Scan).filter(Scan.plot_id == plot.id).count()
    return PlotOut(**{c.name: getattr(plot, c.name) for c in plot.__table__.columns}, scan_count=sc)


@router.put("/{farm_id}/plots/{plot_id}", response_model=PlotOut)
def update_plot(
    farm_id: str,
    plot_id: str,
    payload: PlotUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    plot = db.query(CropPlot).filter(CropPlot.id == plot_id, CropPlot.farm_id == farm_id).first()
    if not plot:
        raise HTTPException(404, "Plot not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(plot, field, value)
    db.commit()
    db.refresh(plot)
    sc = db.query(Scan).filter(Scan.plot_id == plot.id).count()
    return PlotOut(**{c.name: getattr(plot, c.name) for c in plot.__table__.columns}, scan_count=sc)


@router.delete("/{farm_id}/plots/{plot_id}", status_code=204)
def delete_plot(
    farm_id: str,
    plot_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    plot = db.query(CropPlot).filter(CropPlot.id == plot_id, CropPlot.farm_id == farm_id).first()
    if not plot:
        raise HTTPException(404, "Plot not found")
    db.delete(plot)
    db.commit()
