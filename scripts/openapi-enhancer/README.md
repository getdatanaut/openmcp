# OpenAPI Enhancer

A tool for enhancing OpenAPI specifications using OpenAI's language models.

## Description

OpenAPI Enhancer is a command-line utility that processes OpenAPI specification files and enhances them using AI. It leverages OpenAI's language models to improve the quality and completeness of your API documentation.

## Installation

### Prerequisites

- Node.js (as specified in `.nvmrc`)
- An OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/getdatanaut/openmcp.git
   cd openmcp
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up your OpenAI API key:
   Create `.env` based on the present `.env.example` in the `scripts/openapi-enhancer` and insert value for listed variables.

## Usage

```bash
enhance-openapi [..path-to-openapi-spec] [-o output-directory]
```

### Arguments

- `path-to-openapi-spec`: Path to one or more OpenAPI specification files to enhance
- `-o, --output`: (Optional) Directory where enhanced files will be saved

### Examples

Enhance a single OpenAPI specification:
```bash
enhance-openapi specs/api.yaml
```

Enhance multiple specifications:
```bash
enhance-openapi specs/api1.yaml specs/api2.yaml
```

Specify an output directory:
```bash
enhance-openapi specs/api.yaml -o enhanced-specs/
```

## Features

- Processes OpenAPI specification files using AI to enhance documentation
- Supports concurrent processing of multiple files
- Customizable output location
- Preserves original files by creating new enhanced versions

## How It Works

1. The tool loads the OpenAPI specification document
2. It generates a prompt based on the document content
3. The prompt is sent to OpenAI's language model
4. The model's response is processed and applied to the document
5. The enhanced document is saved to a new file with a `.updated.yaml` suffix or to the specified output location

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../../LICENSE) file for details.
