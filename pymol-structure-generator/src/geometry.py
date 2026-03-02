import math

def calculate_backbone_length(atoms):
    """
    Calculate the backbone length of a protein structure.

    Parameters:
        atoms (list of dict): A list of atom dictionaries, each containing 'x', 'y', 'z', and 'type'.
                              Only backbone atoms (e.g., 'N', 'CA', 'C') are considered.

    Returns:
        float: The total backbone length.
    """
    backbone_atoms = [atom for atom in atoms if atom['type'] in {'N', 'CA', 'C'}]
    total_length = 0.0

    for i in range(1, len(backbone_atoms)):
        x1, y1, z1 = backbone_atoms[i - 1]['x'], backbone_atoms[i - 1]['y'], backbone_atoms[i - 1]['z']
        x2, y2, z2 = backbone_atoms[i]['x'], backbone_atoms[i]['y'], backbone_atoms[i]['z']
        distance = math.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2)
        total_length += distance

    return total_length