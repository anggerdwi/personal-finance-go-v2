package main

import (
	"github.com/gin-gonic/gin"
	"personal-finance-gin/config"
	"personal-finance-gin/controllers"
	"personal-finance-gin/middleware"
)
func main(){
	config.ConnectDB()

	r := gin.Default()
	r.POST("/register", controllers.Register)
	r.POST("/login",  controllers.Login)

	authorized := r.Group("/")
	authorized.Use(middleware.AuthMiddleware())
{
	authorized.POST("/transactions", controllers.CreateTransaction)
	authorized.GET("/transactions", controllers.GetTransaction)
	authorized.GET("/transactions/:id", controllers.GetTransactionByID)
	authorized.PUT("/transactions/:id", controllers.Updatetransaction)
	authorized.DELETE("/transactions/:id", controllers.DeleteTransaction)
	authorized.GET("/summary", controllers.GetSummary)
}

	r.GET("/", func(c *gin.Context){
		c.JSON(200, gin.H{
			"message": "personal finance API running",
		})
	})
	r.Run(":8080")
}