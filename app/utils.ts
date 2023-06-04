import chalk from "chalk";
import readline from "readline";
import fs from "fs";
import { glob } from "glob";
import path from "path";
import childProcess from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const cwd = () => {
  let result = path.resolve(process.cwd());
  if (result === "/") return "";
  return result;
};

/**
 *
 * @returns The package.json file as an object
 */
export const getPackageJson = (): any => {
  return JSON.parse(fs.readFileSync(path.join(cwd(), "package.json"), "utf8"));
};

/**
 * Will replace all seperators in the path with the correct seperator for the current OS before glob. It also won't throw unless specified.
 * @param path
 */
export const safeGlob = async (
  path: string,
  throwAll: boolean = false,
  shouldLog: boolean = true
): Promise<string[]> => {
  path = normalizeSeperators(path);
  return await glob(path);
};

export const normalizeSeperators = (path: string) => {
  return path.replace(/\\/g, "/");
};

export const question = (query: string) => {
  console.log("\n");
  console.log(chalk.cyanBright(query));
  return new Promise<string>((resolve) => {
    rl.question("👌 ", (answer) => {
      if (answer.length === 0) return resolve(null);
      resolve(answer);
    });
  });
};

export const confirm = (query: string) => {
  console.log(chalk.cyanBright(query));
  return new Promise<boolean>((resolve) => {
    rl.question("(y/n): ", (answer) => {
      if (
        answer.toLowerCase() === "y" ||
        answer.toLowerCase() === "yes" ||
        answer[0] === "y"
      )
        return resolve(true);
      else if (
        answer.toLowerCase() === "n" ||
        answer.toLowerCase() === "no" ||
        answer[0] === "n"
      )
        return resolve(false);
      else {
        console.log(chalk.redBright("Please enter either y/n"));
        return confirm(query).then((choice) => {
          resolve(choice);
        });
      }
    });
  });
};

export const choice = (query: string, choices: string[], help: string = "") => {
  let choiceString = choices
    .map((choice, index) => {
      return chalk.gray.underline(`${index + 1})`) + ` ${choice}`;
    })
    .join("\n");
  console.log("\n");
  console.log(chalk.cyanBright(query));
  console.log(choiceString);
  if (help) console.log(chalk.gray(help));

  return new Promise<number>((resolve) => {
    rl.question("👌 ", (answer) => {
      if (!answer || answer === "") resolve(0);

      let int = parseInt(answer);

      if (int > choices.length) {
        return errorAndClear("Invalid Choice").then(() => {
          choice(query, choices).then((choice) => {
            resolve(choice);
          });
        });
      }
      if (isNaN(int))
        return resolve(
          choices.indexOf(
            choices.filter(
              (choice) =>
                choice.toLowerCase().includes(answer.toLowerCase()) &&
                answer.length >= Math.ceil(choice.length / 2)
            )[0]
          )
        );
      else return resolve(int - 1);
    });
  });
};

export const errorAndClear = async (error: string) => {
  console.log(chalk.redBright(error));
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
  console.clear();
};

//will let the user select a directory using the terminal
export const selectDirectory = async () => {
  let selectedDir = cwd() + "/";
  let selectedChoice = await choice("Select a directory", [
    "Current Directory",
    "Enter Directory",
    "Find Directory",
    "Cancel",
  ]);

  let newDir = async () => {
    let dir = await question("Enter new folder name");

    if (!dir) return selectDirectory();

    if (!dir.endsWith("/")) dir = dir + "/";

    //should contain two slashes
    if (dir.split("/").length !== 2)
      dir = dir.split("/").slice(0, -1).join("/") + "/";

    if (fs.existsSync(selectedDir + dir))
      return errorAndClear("Directory already exists").then(() => {
        return selectDirectory();
      });

    fs.mkdirSync(selectedDir + dir);
    selectedDir = selectedDir + dir;
  };

  if (selectedChoice === 0) return cwd() + "/";
  else if (selectedChoice == 1) {
    let dir = await question("Enter a directory");

    if (!fs.existsSync(dir))
      return errorAndClear("Directory does not exist").then(() => {
        return selectDirectory();
      });

    return dir;
  } else if (selectedChoice === 2) {
    //list the current directory
    let listDir = async (dir: string) => {
      let choices = await safeGlob(dir + "/*", false, false);
      choices = choices.map((choice) => {
        if (choice.endsWith("/")) choice = choice.slice(0, -1);
        return choice.split("/").slice(-1)[0];
      });
      choices = choices.filter(
        (choice) =>
          choice !== "node_modules" &&
          fs.lstatSync(dir + "/" + choice).isDirectory()
      );
      choices.push(chalk.magenta("<Back>"));
      choices.push(chalk.cyan("<Use Current Directory>"));
      choices.push(chalk.yellow("<Make New Folder>"));
      choices.push(chalk.red("<Cancel>"));

      let choiceIndex = await choice(
        "Select a directory",
        choices,
        "\nCurrent Directory: " + dir + "\n"
      );
      if (choiceIndex === choices.length - 1) return null;

      if (choiceIndex === choices.length - 2) {
        selectedDir = dir;
        await newDir();
        return await listDir(selectedDir);
      }

      if (choiceIndex === choices.length - 3) {
        return selectedDir;
      }
      if (choiceIndex === choices.length - 4) {
        return await listDir(dir.split("/").slice(0, -2).join("/") + "/");
      }

      if (choices[choiceIndex]) selectedDir = dir + choices[choiceIndex];

      if (!selectedDir.endsWith("/")) selectedDir = selectedDir + "/";
      return await listDir(selectedDir);
    };

    return await listDir(selectedDir);
  } else if (selectedChoice === 3) {
    return null;
  }
};

export const runCommand = async (command: string) => {
  let args = command.split(" ");
  let cmd = args[0];
  args = args.slice(1);

  let child = childProcess.spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
  });

  return new Promise((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(false);
    });
  });
};
