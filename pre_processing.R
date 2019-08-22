raw_data <- read.csv("Pos0_647nm_561nm_combined_clean.csv", header = F, stringsAsFactors = F, check.names = F)
colnames(raw_data) <- c("X", "Y", "NA", "cellID", "gene")
# summary(raw_data$X)
# summary(raw_data$Y)
total_size <- 8192

for(k in 0:5){
  width <- total_size / (2^k)
  tile_number <- 2^k-1
  new_dir <- paste0("/Users/zhaotianxiao/Desktop/test/tile_point/", k, "/")
  dir.create(new_dir, mode = '0777', showWarnings = F)
  setwd(new_dir)
  for(i in 0:tile_number){
    for(j in 0:tile_number){
      tile_data <- subset(raw_data, X >= (i-1)*width)
      tile_data <- subset(tile_data, X < (i+2)*width)
      tile_data <- subset(tile_data, Y >=(j-1)*width)
      tile_data <- subset(tile_data, Y < (j+2)*width)
      filename <- paste0("X_", i, "_Y_", j, ".csv")
      write.table(tile_data, filename, col.names = F, row.names = F, sep = ",", quote = F)
    }
  }
}
