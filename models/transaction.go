package models

import(
	"gorm.io/gorm"
)

type Transaction struct{
	gorm.Model
	Type string
	Amount float64
	Notes string
}