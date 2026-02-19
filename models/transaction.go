package models

import(
	"gorm.io/gorm"
)

type Transaction struct{
	gorm.Model
	Type string `json:"type" binding:"required,oneof=income expense"`
	Amount float64 `json:"amount" binding:"required,gt=0"`
	Notes string `json:"notes" binding:"max=255"`
}