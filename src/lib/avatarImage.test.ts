import { describe, it, expect } from "vitest";
import { resizeImageToDataUrl, AvatarImageError } from "./avatarImage";

function fakeFile(type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], "avatar", { type });
}

describe("resizeImageToDataUrl validation", () => {
  it("rejects non-image files before ever touching the file contents", async () => {
    await expect(resizeImageToDataUrl(fakeFile("text/plain", 100))).rejects.toBeInstanceOf(
      AvatarImageError,
    );
  });

  it("rejects files over the size cap, so a huge upload can't silently blow the localStorage quota", async () => {
    await expect(
      resizeImageToDataUrl(fakeFile("image/png", 20 * 1024 * 1024)),
    ).rejects.toBeInstanceOf(AvatarImageError);
  });
});
