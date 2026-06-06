import { NextResponse } from "next/server";

type ReputationConfirmRequest = {
  agentId?: unknown;
  taskId?: unknown;
  contractAddress?: unknown;
  chain?: unknown;
  txHash?: unknown;
  blockNumber?: unknown;
};

const REQUIRED_FIELDS = [
  "agentId",
  "taskId",
  "contractAddress",
  "chain",
  "txHash",
] as const;

export async function POST(request: Request) {
  let body: ReputationConfirmRequest;

  try {
    body = (await request.json()) as ReputationConfirmRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !isNonEmptyString(body[field]));

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        missingFields,
      },
      { status: 400 },
    );
  }

  if (
    body.blockNumber !== undefined &&
    body.blockNumber !== null &&
    typeof body.blockNumber !== "number"
  ) {
    return NextResponse.json(
      { error: "blockNumber must be a number or null" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    status: "confirmed",
    backendSyncStatus: "confirmed",
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
