const fs = require("fs");
const readline = require("readline");

function processBusinessModels(inputFile, outputFile = "businessModels.json", outputFile2 = "businessModelsReverses.json") {
  fs.readFile(inputFile, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    try {
      const businessModels = JSON.parse(data);

      const result = {};
      const resultReversed = {};
      businessModels.forEach((model) => {
        result[model.name] = model.business_model_id;
        resultReversed[model.business_model_id] = model.name;
      });

      fs.writeFile(
        outputFile,
        JSON.stringify(result, null, 2),
        "utf8",
        (err) => {
          if (err) {
            console.error("Error writing file:", err);
            return;
          }
          console.log("File written successfully.");
        }
      );

      fs.writeFile(
        outputFile2,
        JSON.stringify(resultReversed, null, 2),
        "utf8",
        (err) => {
          if (err) {
            console.error("Error writing file:", err);
            return;
          }
          console.log("File written successfully.");
        }
      );
    } catch (err) {
      console.error("Error parsing JSON:", err);
    }
  });
}

function askForFilePath() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Enter '1' to use the local file or '2' to specify a custom file path: ",
    (answer) => {
      if (answer === "1") {
        processBusinessModels("businessModelsRaw.json");
        rl.close();
      } else if (answer === "2") {
        rl.question("Please enter the path to the input file: ", (path) => {
          processBusinessModels(path.trim());
          rl.close();
        });
      } else {
        console.error("Invalid input. Please enter '1' or '2'.");
        rl.close();
      }
    }
  );
}

module.exports = {
  askForFilePath,
};
