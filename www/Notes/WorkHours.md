
### 2014-05-08

#### 13:40-14:00
#### 16:00-18:40

- Setup Project
- Setup Host Site
- Create Sample Problems
	- Define 10 word and equation problems that use variables and objects.
- Parse Sample Problems - Main File Parts
	- Parse the problems and their contexts.


### 2014-05-09

#### 8:40-9:05

- Parse Variable
	- Define the Variable data structure

#### 10:25-10:55

- Parse the content of the variables text block

#### 11:55-12:35
#### 13:10-13:25
#### 15:00-15:40

- Fix RegExp for parsing variables

#### 16:40-17:20
#### 17:50-18:10

- Parse Question and Answer

### 2014-05-10
#### 10:40-10:50
#### 11:05-11:45
#### 12:10-12:20

- Flatten the scope to get all the variable definitions in scope

#### 13:40-15:10

- Calculate the sample values with possible ranges

#### 15:40-16:05

- Create a debug problem instance with the sample values and range

#### 16:45-17:15
#### 17:40-18:20

- Calculate the word sample values
- Create some problem instances with the sample values

### 2014-05-12

#### 6:00-7:40
#### 11:00-11:30
#### 15:10-17:45

- Started: getModifiedWordText
- BUG: Variables are evaluated in order of definition (not in order of text, therefore the preceeding values references must be found before re-ordering)
- Restructure logic to better create problem instances

### 2014-05-13

#### 6:05-6:35

- Display problems in html

#### 6:35-6:55

- getModifiedWordText (reintroduce logic)

#### 6:55-7:00
#### 7:10-7:20

- Capitalize

#### 14:20-15:00

- Keep main name at beginning of each line (to also handle pronouns in option phrases)

#### 15:15-15:40

- Handle || in the problemText
- Generate final sample problems

#### 17:30-18:00

- Calculate a value for each variable: This is for the case where it is not referenced in the text: x+y=m+_  (Sum not referred)

#### FUTURE
