# services/quadrant_visual.py
import matplotlib.pyplot as plt

def draw_macro_quadrant_box(growth, inflation, output_path="static/macro_box.png"):
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.axhline(0, color="black")
    ax.axvline(0, color="black")

    # Scatter the current macro position
    ax.scatter(growth, inflation, s=200, color="red", label="Current Position")

    # Label quadrants
    ax.text(2.5, 3.5, "Quad 1\nGrowth ↑ / Inflation ↑", ha='center', fontsize=12)
    ax.text(-2.5, 3.5, "Quad 4\nGrowth ↓ / Inflation ↑", ha='center', fontsize=12)
    ax.text(-2.5, -3.5, "Quad 3\nGrowth ↓ / Inflation ↓", ha='center', fontsize=12)
    ax.text(2.5, -3.5, "Quad 2\nGrowth ↑ / Inflation ↓", ha='center', fontsize=12)

    ax.set_xlim(-5, 5)
    ax.set_ylim(-5, 5)
    ax.set_xlabel("Real GDP YoY (%)")
    ax.set_ylabel("CPI YoY (%)")
    ax.set_title("Macro Economic Quadrant")
    ax.legend()
    ax.grid(True)

    plt.savefig(output_path)
    plt.close()
    return output_path
