// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders a heading and a link home", async () => {
    const Stub = createRoutesStub([{ path: "*", Component: NotFound }]);
    render(<Stub initialEntries={["/missing"]} />);
    expect(await screen.findByRole("heading", { name: /404/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /index\.html/ })).toHaveAttribute("href", "/");
  });
});
