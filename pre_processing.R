raw_data <- read.csv("Pos0_647nm_561nm_combined_clean.csv", header = F, stringsAsFactors = F, check.names = F)
colnames(raw_data) <- c("X", "Y", "NA", "cellID", "gene")
raw_data$cellID <- as.numeric(raw_data$cellID)
cell_num <- max(raw_data$cellID)
wd <- getwd()
new_dir <- paste0(wd, "/cells/")
dir.create(new_dir, mode = '0777', showWarnings = F)
setwd(new_dir)
for(k in 1:cell_num){
  temp <- subset(raw_data, cellID == k)
  filename <- paste0(k, ".csv")
  write.table(temp, filename, col.names = F, row.names = F, sep = ",", quote = F)
}