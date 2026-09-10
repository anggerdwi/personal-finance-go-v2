package models

import "gorm.io/gorm"

type Category struct {
	gorm.Model

	UserID      uint   `json:"user_id"`
	WorkspaceID uint   `json:"workspace_id"`
	Name        string `json:"name" binding:"max=100"`
}