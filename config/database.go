package config

import (
	"fmt"
	"personal-finance-gin/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB(){
	dsn := "root:@tcp(127.0.0.1:3306)/personal_finance?charset=utf8mb4&parseTime=True&loc=Local"

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil{
		panic("failed to connect database!")
	}
	fmt.Println("database connected succesfully!")

	DB = database

	DB.AutoMigrate(&models.User{})
	DB.AutoMigrate(&models.Transaction{})

	fmt.Println("database connected successfully!")
}