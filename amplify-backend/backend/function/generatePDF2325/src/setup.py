from setuptools import setup

setup(
    name='src',
    version='1.0',
    packages=[''],
    install_requires=[
        'reportlab==4.0.4',
        'Pillow==10.0.0',
        'boto3==1.26.137'
    ],
    python_requires='>=3.8'
)
